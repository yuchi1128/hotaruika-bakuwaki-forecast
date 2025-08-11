package main

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/robfig/cron/v3"

	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

var db *sql.DB
var logger *slog.Logger

// predictionCacheは、キャッシュされた予測データと、安全な並行アクセスのためのミューテックスを保持する
var predictionCache struct {
	sync.RWMutex
	data []byte
}

var predictionURL string

// Postはフォーラムの投稿を表す
type Post struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	ImageURL  *string   `json:"image_url"`
	Label     string    `json:"label"`
	CreatedAt time.Time `json:"created_at"`
	GoodCount int       `json:"good_count"`
	BadCount  int       `json:"bad_count"`
}

// Replyは投稿や他の返信への返信を表す
type Reply struct {
	ID             int       `json:"id"`
	PostID         int       `json:"post_id"`
	ParentReplyID  *int      `json:"parent_reply_id"`
	Username       string    `json:"username"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
	GoodCount      int       `json:"good_count"`
	BadCount       int       `json:"bad_count"`
	ParentUsername *string   `json:"parent_username,omitempty"`
}

// Reactionはgood/badのリアクションを表す
type Reaction struct {
	ID           int       `json:"id"`
	PostID       *int      `json:"post_id"`
	ReplyID      *int      `json:"reply_id"`
	ReactionType string    `json:"reaction_type"`
	CreatedAt    time.Time `json:"created_at"`
}

func main() {
	// 構造化ロガーを初期化する
	logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// --- データベース接続 ---
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		logger.Error("DATABASE_URL environment variable not set")
		os.Exit(1)
	}

	predictionURL = os.Getenv("PREDICTION_API_URL")
	if predictionURL == "" {
		logger.Error("PREDICTION_API_URL environment variable not set")
		os.Exit(1)
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		logger.Error("Error opening database", "error", err)
		os.Exit(1)
	}

	err = db.Ping()
	if err != nil {
		logger.Error("Error connecting to the database", "error", err)
		os.Exit(1)
	}
	logger.Info("Successfully connected to the database!")

	// --- ディレクトリ設定 ---
	if _, err := os.Stat("./uploads"); os.IsNotExist(err) {
		err = os.Mkdir("./uploads", 0755)
		if err != nil {
			logger.Error("Failed to create uploads directory", "error", err)
			os.Exit(1)
		}
	}

	// --- 予測データの取得とキャッシュ ---
	// 起動時に最初のデータ取得を実行する
	fetchAndCachePredictionData()

	// スケジューラを設定する
	jst, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		logger.Error("Failed to load JST timezone", "error", err)
		os.Exit(1)
	}
	c := cron.New(cron.WithLocation(jst))
	// スケジュール: 日本時間の 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00
	_, err = c.AddFunc("0 2,5,8,11,14,17,20,23 * * *", fetchAndCachePredictionData)
	if err != nil {
		logger.Error("Failed to add cron job", "error", err)
		os.Exit(1)
	}
	c.Start()
	logger.Info("Cron scheduler started for fetching prediction data.")

	// --- HTTPサーバー設定 ---
	mux := http.NewServeMux()
	mux.HandleFunc("/api/prediction", getPredictionHandler)
	mux.HandleFunc("/api/posts", postsHandler)
	mux.HandleFunc("/api/posts/", postDetailHandler)
	mux.HandleFunc("/api/replies/", replyDetailHandler)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, Backend!")
	})

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", "https://bakuwaki-yoho.com"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}).Handler(mux)

	logger.Info("Server starting on port 8080...")
	if err := http.ListenAndServe(":8080", corsHandler); err != nil {
		logger.Error("Server failed to start", "error", err)
		os.Exit(1)
	}
}

// fetchAndCachePredictionDataは、予測APIからデータを取得し、それをキャッシュする
func fetchAndCachePredictionData() {
	logger.Info("Attempting to fetch prediction data", "url", predictionURL)

	resp, err := http.Get(predictionURL)
	if err != nil {
		logger.Error("Failed to fetch prediction data", "error", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Error("Prediction API returned non-OK status", "status_code", resp.StatusCode)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error("Failed to read prediction response body", "error", err)
		return
	}

	// 取得したデータが有効なJSONか検証する
	if !json.Valid(body) {
		logger.Error("Fetched prediction data is not valid JSON")
		return
	}

	predictionCache.Lock()
	predictionCache.data = body
	predictionCache.Unlock()

	logger.Info("Successfully fetched and cached new prediction data")
}

// getPredictionHandlerは、キャッシュされた予測データを提供する
func getPredictionHandler(w http.ResponseWriter, r *http.Request) {
	predictionCache.RLock()
	data := predictionCache.data
	predictionCache.RUnlock()

	if data == nil {
		// 予測データがリクエストされたが、キャッシュが空である
		logger.Warn("Prediction data requested but cache is empty")
		http.Error(w, "Prediction data not available yet. Please try again later.", http.StatusServiceUnavailable)
		return
	}

	// 送信する前にデータが有効なJSONかチェックする
	if !json.Valid(data) {
		// 内部サーバーエラー：キャッシュされたデータが破損している
		logger.Error("Invalid JSON data in cache")
		http.Error(w, "Internal server error: cached data is corrupted.", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	// データを書き込むためにバッファを使用するこの方が効率的である
	_, err := io.Copy(w, bytes.NewReader(data))
	if err != nil {
		logger.Error("Failed to write prediction response", "error", err)
		// ヘッダーはすでに送信されている可能性が高いため、通常のhttp.Errorは送信できない
	}
}

func postsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getPosts(w, r)
	case http.MethodPost:
		createPost(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func postDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 || pathSegments[2] == "" {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	postID, err := strconv.Atoi(pathSegments[2])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	if len(pathSegments) == 3 {
		// /api/posts/{id} の処理 - 未実装
		http.Error(w, "Not Implemented", http.StatusNotImplemented)
		return
	} else if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodGet:
			getRepliesForPost(w, r, postID)
		case http.MethodPost:
			createReplyToPost(w, r, postID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		switch r.Method {
		case http.MethodPost:
			createPostReaction(w, r, postID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	} else {
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}

func replyDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 || pathSegments[2] == "" {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	replyID, err := strconv.Atoi(pathSegments[2])
	if err != nil {
		http.Error(w, "Invalid reply ID", http.StatusBadRequest)
		return
	}

	if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodPost:
			createReplyToReply(w, r, replyID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		switch r.Method {
		case http.MethodPost:
			createReplyReaction(w, r, replyID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	} else {
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}

func createPost(w http.ResponseWriter, r *http.Request) {
	var post Post
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// ラベルを検証する
	if post.Label != "現地情報" && post.Label != "その他" {
		http.Error(w, "Invalid label. Must be '現地情報' or 'その他'", http.StatusBadRequest)
		return
	}

	var imageURL *string
	if post.ImageURL != nil && *post.ImageURL != "" {
		// base64形式の画像をデコードしてファイルに保存する
		dataURL := *post.ImageURL
		parts := strings.SplitN(dataURL, ";base64,", 2)
		if len(parts) != 2 {
			http.Error(w, "Invalid image data format", http.StatusBadRequest)
			return
		}

		// データURLからファイルの拡張子を抽出する
		mimeType := strings.TrimPrefix(parts[0], "data:")
		extension := "jpg" // デフォルトはjpgとする
		if strings.Contains(mimeType, "png") {
			extension = "png"
		} else if strings.Contains(mimeType, "gif") {
			extension = "gif"
		} else if strings.Contains(mimeType, "jpeg") {
			extension = "jpeg"
		}

		decoded, err := base64.StdEncoding.DecodeString(parts[1])
		if err != nil {
			http.Error(w, "Failed to decode image", http.StatusInternalServerError)
			return
		}

		filename := fmt.Sprintf("%d.%s", time.Now().UnixNano(), extension)
		filePath := filepath.Join("./uploads", filename)
		err = os.WriteFile(filePath, decoded, 0644)
		if err != nil {
			logger.Error("Failed to save image", "error", err)
			http.Error(w, "Failed to save image", http.StatusInternalServerError)
			return
		}
		url := "/uploads/" + filename
		imageURL = &url
	}

	query := `INSERT INTO posts (username, content, image_url, label) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err = db.QueryRow(query, post.Username, post.Content, imageURL, post.Label).Scan(&post.ID, &post.CreatedAt)
	if err != nil {
		logger.Error("Error inserting post", "error", err)
		http.Error(w, "Could not create post", http.StatusInternalServerError)
		return
	}

	post.ImageURL = imageURL
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func getPosts(w http.ResponseWriter, r *http.Request) {
	query := `
        SELECT
            p.id, p.username, p.content, p.image_url, p.label, p.created_at,
            COALESCE(r_good.count, 0) as good_count,
            COALESCE(r_bad.count, 0) as bad_count
        FROM posts p
        LEFT JOIN (
            SELECT post_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY post_id
        ) r_good ON p.id = r_good.post_id
        LEFT JOIN (
            SELECT post_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY post_id
        ) r_bad ON p.id = r_bad.post_id
    `

	label := r.URL.Query().Get("label")
	if label != "" {
		if label != "現地情報" && label != "その他" {
			http.Error(w, "Invalid label filter. Must be '現地情報' or 'その他'", http.StatusBadRequest)
			return
		}
		query += fmt.Sprintf(" WHERE p.label = '%s'", label)
	}
	query += " ORDER BY p.created_at DESC"

	rows, err := db.Query(query)
	if err != nil {
		logger.Error("Error querying posts", "error", err)
		http.Error(w, "Could not retrieve posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var post Post
		var imageUrl sql.NullString
		err := rows.Scan(&post.ID, &post.Username, &post.Content, &imageUrl, &post.Label, &post.CreatedAt, &post.GoodCount, &post.BadCount)
		if err != nil {
			logger.Error("Error scanning post row", "error", err)
			continue
		}
		if imageUrl.Valid {
			post.ImageURL = &imageUrl.String
		} else {
			post.ImageURL = nil
		}
		posts = append(posts, post)
	}

	if err = rows.Err(); err != nil {
		logger.Error("Error after iterating rows", "error", err)
		http.Error(w, "Error retrieving posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func createReplyToPost(w http.ResponseWriter, r *http.Request, postID int) {
	var reply Reply
	err := json.NewDecoder(r.Body).Decode(&reply)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO replies (post_id, username, content) VALUES ($1, $2, $3) RETURNING id, created_at`
	err = db.QueryRow(query, postID, reply.Username, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		logger.Error("Error inserting reply to post", "error", err)
		http.Error(w, "Could not create reply", http.StatusInternalServerError)
		return
	}

	reply.PostID = postID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func createReplyToReply(w http.ResponseWriter, r *http.Request, parentReplyID int) {
	var reply Reply
	err := json.NewDecoder(r.Body).Decode(&reply)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 親の返信からpost_idを取得する
	var postID int
	row := db.QueryRow("SELECT post_id FROM replies WHERE id = $1", parentReplyID)
	err = row.Scan(&postID)
	if err != nil {
		logger.Error("Error getting post_id from parent reply", "error", err)
		http.Error(w, "Parent reply not found", http.StatusNotFound)
		return
	}

	query := `INSERT INTO replies (post_id, parent_reply_id, username, content) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err = db.QueryRow(query, postID, parentReplyID, reply.Username, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		logger.Error("Error inserting reply to reply", "error", err)
		http.Error(w, "Could not create reply", http.StatusInternalServerError)
		return
	}

	reply.PostID = postID
	reply.ParentReplyID = &parentReplyID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func getRepliesForPost(w http.ResponseWriter, r *http.Request, postID int) {
	query := `
        SELECT
            r.id, r.post_id, r.parent_reply_id, r.username, r.content, r.created_at,
            COALESCE(r_good.count, 0) as good_count,
            COALESCE(r_bad.count, 0) as bad_count,
            COALESCE(pr.username, p.username) as parent_username
        FROM replies r
        LEFT JOIN posts p ON r.post_id = p.id
        LEFT JOIN replies pr ON r.parent_reply_id = pr.id
        LEFT JOIN (
            SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY reply_id
        ) r_good ON r.id = r_good.reply_id
        LEFT JOIN (
            SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY reply_id
        ) r_bad ON r.id = r_bad.reply_id
        WHERE r.post_id = $1
        ORDER BY r.created_at ASC
    `
	rows, err := db.Query(query, postID)
	if err != nil {
		logger.Error("Error querying replies", "error", err)
		http.Error(w, "Could not retrieve replies", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	replies := []Reply{}
	for rows.Next() {
		var reply Reply
		var parentReplyID sql.NullInt64
		var parentUsername sql.NullString
		err := rows.Scan(&reply.ID, &reply.PostID, &parentReplyID, &reply.Username, &reply.Content, &reply.CreatedAt, &reply.GoodCount, &reply.BadCount, &parentUsername)
		if err != nil {
			logger.Error("Error scanning reply row", "error", err)
			continue
		}
		if parentReplyID.Valid {
			val := int(parentReplyID.Int64)
			reply.ParentReplyID = &val
		} else {
			reply.ParentReplyID = nil
		}
		if parentUsername.Valid {
			reply.ParentUsername = &parentUsername.String
		} else {
			reply.ParentUsername = nil
		}
		replies = append(replies, reply)
	}

	if err = rows.Err(); err != nil {
		logger.Error("Error after iterating rows", "error", err)
		http.Error(w, "Error retrieving replies", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(replies)
}

func createPostReaction(w http.ResponseWriter, r *http.Request, postID int) {
	var reaction Reaction
	err := json.NewDecoder(r.Body).Decode(&reaction)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if reaction.ReactionType != "good" && reaction.ReactionType != "bad" {
		http.Error(w, "Invalid reaction type. Must be 'good' or 'bad'", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO reactions (post_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err = db.QueryRow(query, postID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		logger.Error("Error inserting post reaction", "error", err)
		http.Error(w, "Could not create reaction", http.StatusInternalServerError)
		return
	}

	val := postID
	reaction.PostID = &val
	reaction.ReplyID = nil
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

func createReplyReaction(w http.ResponseWriter, r *http.Request, replyID int) {
	var reaction Reaction
	err := json.NewDecoder(r.Body).Decode(&reaction)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if reaction.ReactionType != "good" && reaction.ReactionType != "bad" {
		http.Error(w, "Invalid reaction type. Must be 'good' or 'bad'", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO reactions (reply_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err = db.QueryRow(query, replyID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		logger.Error("Error inserting reply reaction", "error", err)
		http.Error(w, "Could not create reaction", http.StatusInternalServerError)
		return
	}

	val := replyID
	reaction.ReplyID = &val
	reaction.PostID = nil
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

// URLのパスセグメントを分割するヘルパー関数
func splitPath(path string) []string {
	var segments []string
	for _, s := range strings.Split(path, "/") {
		if s != "" {
			segments = append(segments, s)
		}
	}
	return segments
}