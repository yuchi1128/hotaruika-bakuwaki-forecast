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

	"github.com/golang-jwt/jwt/v5"
	"github.com/lib/pq"
	"github.com/robfig/cron/v3"
	"github.com/rs/cors"
)

var db *sql.DB
var logger *slog.Logger
var jwtKey []byte

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
	ImageURLs []string  `json:"image_urls"`
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

// ClaimsはJWTのペイロードを表す
type Claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// LoginRequestはログインリクエストのボディを表す
type LoginRequest struct {
	Password string `json:"password"`
}

func main() {
	// 構造化ロガーを初期化する
	logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// JWTキーを設定する
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		logger.Warn("環境変数ADMIN_PASSWORDが設定されていません。管理者機能は無効になります。")
	}
	jwtSecret := os.Getenv("JWT_SECRET_KEY")
	if jwtSecret == "" {
		logger.Error("環境変数JWT_SECRET_KEYが設定されていません")
		os.Exit(1)
	}
	jwtKey = []byte(jwtSecret)

	// --- データベース接続 ---
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		logger.Error("環境変数DATABASE_URLが設定されていません")
		os.Exit(1)
	}

	predictionURL = os.Getenv("PREDICTION_API_URL")
	if predictionURL == "" {
		logger.Error("環境変数PREDICTION_API_URLが設定されていません")
		os.Exit(1)
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		logger.Error("データベースのオープンエラー", "error", err)
		os.Exit(1)
	}

	err = db.Ping()
	if err != nil {
		logger.Error("データベースへの接続エラー", "error", err)
		os.Exit(1)
	}
	logger.Info("データベースに正常に接続しました！")

	// --- ディレクトリ設定 ---
	if _, err := os.Stat("./uploads"); os.IsNotExist(err) {
		err = os.Mkdir("./uploads", 0755)
		if err != nil {
			logger.Error("uploadsディレクトリの作成に失敗しました", "error", err)
			os.Exit(1)
		}
	}

	// --- 予測データの取得とキャッシュ ---
	fetchAndCachePredictionData()
	c := cron.New()
	_, err = c.AddFunc("0 2,5,8,11,14,17,20,23 * * *", fetchAndCachePredictionData)
	if err != nil {
		logger.Error("cronジョブの追加に失敗しました", "error", err)
		os.Exit(1)
	}
	c.Start()
	logger.Info("予測データ取得のためのcronスケジューラを開始しました。")

	// --- HTTPサーバー設定 ---
	mux := http.NewServeMux()
	mux.HandleFunc("/api/prediction", getPredictionHandler)
	mux.HandleFunc("/api/posts", postsHandler)
	mux.HandleFunc("/api/posts/", postDetailHandler)
	mux.HandleFunc("/api/replies/", replyDetailHandler)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))
	mux.HandleFunc("/api/admin/login", adminLoginHandler)
	mux.HandleFunc("/api/admin/logout", adminLogoutHandler)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "こんにちは、バックエンドです！")
	})

	// CORS設定
	allowedOriginsStr := os.Getenv("ALLOWED_ORIGINS")
	var allowedOrigins []string
	if allowedOriginsStr != "" {
		allowedOrigins = strings.Split(allowedOriginsStr, ",")
		logger.Info("CORS AllowedOriginsを環境変数から設定しました", "origins", allowedOrigins)
	} else {
		// 環境変数が設定されていない場合のデフォルト値
		allowedOrigins = []string{"http://localhost:3000", "http://localhost:3001", "https://bakuwaki-yoho.com"}
		logger.Warn("環境変数ALLOWED_ORIGINSが設定されていません。デフォルト値を使用します。")
	}

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins, // ここを環境変数から読み込むように変更
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}).Handler(mux)

	logger.Info("サーバーをポート8080で起動します...")
	if err := http.ListenAndServe(":8080", corsHandler); err != nil {
		logger.Error("サーバーの起動に失敗しました", "error", err)
		os.Exit(1)
	}
}

func fetchAndCachePredictionData() {
	logger.Info("予測データの取得を試みています", "url", predictionURL)
	resp, err := http.Get(predictionURL)
	if err != nil {
		logger.Error("予測データの取得に失敗しました", "error", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Error("予測APIが正常なステータスを返しませんでした", "status_code", resp.StatusCode)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error("予測APIのレスポンスボディの読み取りに失敗しました", "error", err)
		return
	}

	if !json.Valid(body) {
		logger.Error("取得した予測データは有効なJSONではありません")
		return
	}

	predictionCache.Lock()
	predictionCache.data = body
	predictionCache.Unlock()
	logger.Info("新しい予測データを正常に取得し、キャッシュしました")
}

func getPredictionHandler(w http.ResponseWriter, r *http.Request) {
	predictionCache.RLock()
	data := predictionCache.data
	predictionCache.RUnlock()

	if data == nil {
		logger.Warn("予測データがリクエストされましたが、キャッシュは空です")
		http.Error(w, "予測データはまだ利用できません。", http.StatusServiceUnavailable)
		return
	}

	if !json.Valid(data) {
		logger.Error("キャッシュ内のJSONデータが無効です")
		http.Error(w, "内部サーバーエラー: キャッシュデータが破損しています。", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err := io.Copy(w, bytes.NewReader(data))
	if err != nil {
		logger.Error("予測レスポンスの書き込みに失敗しました", "error", err)
	}
}

func adminLoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "リクエストボディが不正です", http.StatusBadRequest)
		return
	}

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		http.Error(w, "管理者機能が設定されていません", http.StatusInternalServerError)
		return
	}

	if req.Password != adminPassword {
		http.Error(w, "パスワードが不正です", http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Role: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "トークンの作成に失敗しました", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "admin_token",
		Value:    tokenString,
		Expires:  expirationTime,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		// Secure: true, // 本番環境ではtrueにすることを強く推奨します
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("admin_token")
		if err != nil {
			if err == http.ErrNoCookie {
				http.Error(w, "認証されていません", http.StatusUnauthorized)
				return
			}
			http.Error(w, "不正なリクエストです", http.StatusBadRequest)
			return
		}

		tokenString := cookie.Value
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil {
			if err == jwt.ErrSignatureInvalid {
				http.Error(w, "トークン署名が不正です", http.StatusUnauthorized)
				return
			}
			http.Error(w, "不正なトークンです", http.StatusBadRequest)
			return
		}

		if !token.Valid || claims.Role != "admin" {
			http.Error(w, "トークンまたはロールが不正です", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func postsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getPosts(w, r)
	case http.MethodPost:
		isAdmin := false
		cookie, err := r.Cookie("admin_token")
		if err == nil {
			tokenString := cookie.Value
			claims := &Claims{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
				return jwtKey, nil
			})
			if err == nil && token.Valid && claims.Role == "admin" {
				isAdmin = true
			}
		}
		createPost(w, r, isAdmin)
	default:
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
	}
}

func postDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 || pathSegments[2] == "" {
		http.Error(w, "見つかりません", http.StatusNotFound)
		return
	}

	postID, err := strconv.Atoi(pathSegments[2])
	if err != nil {
		http.Error(w, "投稿IDが不正です", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodDelete {
		authMiddleware(func(w http.ResponseWriter, r *http.Request) {
			deleteItem(w, r, "posts", postID)
		}).ServeHTTP(w, r)
		return
	}

	if len(pathSegments) == 3 {
		http.Error(w, "実装されていません", http.StatusNotImplemented)
		return
	} else if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodGet:
			getRepliesForPost(w, r, postID)
		case http.MethodPost:
			createReplyToPost(w, r, postID)
		default:
			http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		}
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		switch r.Method {
		case http.MethodPost:
			createPostReaction(w, r, postID)
		default:
			http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		}
	} else {
		http.Error(w, "見つかりません", http.StatusNotFound)
	}
}

func replyDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 || pathSegments[2] == "" {
		http.Error(w, "見つかりません", http.StatusNotFound)
		return
	}

	replyID, err := strconv.Atoi(pathSegments[2])
	if err != nil {
		http.Error(w, "返信IDが不正です", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodDelete {
		authMiddleware(func(w http.ResponseWriter, r *http.Request) {
			deleteItem(w, r, "replies", replyID)
		}).ServeHTTP(w, r)
		return
	}

	if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodPost:
			createReplyToReply(w, r, replyID)
		default:
			http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		}
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		switch r.Method {
		case http.MethodPost:
			createReplyReaction(w, r, replyID)
		default:
			http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		}
	} else {
		http.Error(w, "見つかりません", http.StatusNotFound)
	}
}

func createPost(w http.ResponseWriter, r *http.Request, isAdmin bool) {
	var post Post
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if isAdmin {
		if post.Label != "現地情報" && post.Label != "その他" && post.Label != "管理者" {
			http.Error(w, "ラベルが不正です。「現地情報」、「その他」、「管理者」のいずれかである必要があります", http.StatusBadRequest)
			return
		}
	} else {
		if post.Label == "管理者" {
			http.Error(w, "「管理者」ラベルで投稿することはできません", http.StatusForbidden)
			return
		}
		if post.Label != "現地情報" && post.Label != "その他" {
			http.Error(w, "ラベルが不正です。「現地情報」または「その他」のいずれかである必要があります", http.StatusBadRequest)
			return
		}
	}

	var imageURLs []string
	if len(post.ImageURLs) > 0 {
		for _, dataURL := range post.ImageURLs {
			parts := strings.SplitN(dataURL, ";base64,", 2)
			if len(parts) != 2 {
				http.Error(w, "画像データのフォーマットが不正です", http.StatusBadRequest)
				return
			}

			mimeType := strings.TrimPrefix(parts[0], "data:")
			extension := "jpg"
			if strings.Contains(mimeType, "png") {
				extension = "png"
			} else if strings.Contains(mimeType, "gif") {
				extension = "gif"
			} else if strings.Contains(mimeType, "jpeg") {
				extension = "jpeg"
			}

			decoded, err := base64.StdEncoding.DecodeString(parts[1])
			if err != nil {
				http.Error(w, "画像のデコードに失敗しました", http.StatusInternalServerError)
				return
			}

			filename := fmt.Sprintf("%d.%s", time.Now().UnixNano(), extension)
			filePath := filepath.Join("./uploads", filename)
			err = os.WriteFile(filePath, decoded, 0644)
			if err != nil {
				logger.Error("画像の保存に失敗しました", "error", err)
				http.Error(w, "画像の保存に失敗しました", http.StatusInternalServerError)
				return
			}
			url := "/uploads/" + filename
			imageURLs = append(imageURLs, url)
		}
	}

	query := `INSERT INTO posts (username, content, image_urls, label) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err = db.QueryRow(query, post.Username, post.Content, pq.Array(imageURLs), post.Label).Scan(&post.ID, &post.CreatedAt)
	if err != nil {
		logger.Error("投稿の挿入エラー", "error", err)
		http.Error(w, "投稿を作成できませんでした", http.StatusInternalServerError)
		return
	}

	post.ImageURLs = imageURLs
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func getPosts(w http.ResponseWriter, r *http.Request) {
	baseQuery := `
        SELECT
            p.id, p.username, p.content, p.image_urls, p.label, p.created_at,
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
	var args []interface{}
	var query string

	label := r.URL.Query().Get("label")
	if label != "" {
		if label != "現地情報" && label != "その他" && label != "管理者" {
			http.Error(w, "ラベルフィルターが不正です。「現地情報」、「その他」、「管理者」のいずれかである必要があります", http.StatusBadRequest)
			return
		}
		query = baseQuery + " WHERE p.label = $1 ORDER BY p.created_at DESC"
		args = append(args, label)
	} else {
		query = baseQuery + " ORDER BY p.created_at DESC"
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		logger.Error("投稿のクエリエラー", "error", err)
		http.Error(w, "投稿を取得できませんでした", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var post Post
		err := rows.Scan(&post.ID, &post.Username, &post.Content, pq.Array(&post.ImageURLs), &post.Label, &post.CreatedAt, &post.GoodCount, &post.BadCount)
		if err != nil {
			logger.Error("投稿行のスキャンエラー", "error", err)
			continue
		}
		posts = append(posts, post)
	}

	if err = rows.Err(); err != nil {
		logger.Error("行のイテレーション後のエラー", "error", err)
		http.Error(w, "投稿の取得エラー", http.StatusInternalServerError)
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
		logger.Error("投稿への返信の挿入エラー", "error", err)
		http.Error(w, "返信を作成できませんでした", http.StatusInternalServerError)
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

	var postID int
	row := db.QueryRow("SELECT post_id FROM replies WHERE id = $1", parentReplyID)
	err = row.Scan(&postID)
	if err != nil {
		logger.Error("親返信からのpost_id取得エラー", "error", err)
		http.Error(w, "親となる返信が見つかりません", http.StatusNotFound)
		return
	}

	query := `INSERT INTO replies (post_id, parent_reply_id, username, content) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err = db.QueryRow(query, postID, parentReplyID, reply.Username, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		logger.Error("返信への返信の挿入エラー", "error", err)
		http.Error(w, "返信を作成できませんでした", http.StatusInternalServerError)
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
		logger.Error("返信のクエリエラー", "error", err)
		http.Error(w, "返信を取得できませんでした", http.StatusInternalServerError)
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
			logger.Error("返信行のスキャンエラー", "error", err)
			continue
		}
		if parentReplyID.Valid {
			val := int(parentReplyID.Int64)
			reply.ParentReplyID = &val
		}
		if parentUsername.Valid {
			reply.ParentUsername = &parentUsername.String
		}
		replies = append(replies, reply)
	}

	if err = rows.Err(); err != nil {
		logger.Error("行のイテレーション後のエラー", "error", err)
		http.Error(w, "返信の取得エラー", http.StatusInternalServerError)
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
		http.Error(w, "リアクションタイプが不正です。「good」または「bad」を指定してください", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO reactions (post_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err = db.QueryRow(query, postID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		logger.Error("投稿へのリアクションの挿入エラー", "error", err)
		http.Error(w, "リアクションを作成できませんでした", http.StatusInternalServerError)
		return
	}

	val := postID
	reaction.PostID = &val
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
		http.Error(w, "リアクションタイプが不正です。「good」または「bad」を指定してください", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO reactions (reply_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err = db.QueryRow(query, replyID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		logger.Error("返信へのリアクションの挿入エラー", "error", err)
		http.Error(w, "リアクションを作成できませんでした", http.StatusInternalServerError)
		return
	}

	val := replyID
	reaction.ReplyID = &val
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

func splitPath(path string) []string {
	var segments []string
	for _, s := range strings.Split(path, "/") {
		if s != "" {
			segments = append(segments, s)
		}
	}
	return segments
}

func deleteItem(w http.ResponseWriter, r *http.Request, itemType string, itemID int) {
	var tableName string
	var imageColumn string
	if itemType == "posts" {
		tableName = "posts"
		imageColumn = "image_urls"
	} else if itemType == "replies" {
		tableName = "replies"
	} else {
		http.Error(w, "アイテムタイプが不正です", http.StatusBadRequest)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		logger.Error("トランザクションの開始に失敗しました", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	if imageColumn != "" {
		var imageURLs pq.StringArray
		query := fmt.Sprintf("SELECT %s FROM %s WHERE id = $1", imageColumn, tableName)
		err := tx.QueryRow(query, itemID).Scan(&imageURLs)
		if err != nil && err != sql.ErrNoRows {
			logger.Error("画像URLのクエリに失敗しました", "error", err)
			http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
			return
		}
		if len(imageURLs) > 0 {
			for _, url := range imageURLs {
				filename := filepath.Base(url)
				filePath := filepath.Join("./uploads", filename)
				if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
					logger.Warn("画像ファイルの削除に失敗しました", "path", filePath, "error", err)
				}
			}
		}
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE id = $1", tableName)
	_, err = tx.Exec(query, itemID)
	if err != nil {
		logger.Error("データベースからのアイテム削除に失敗しました", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		logger.Error("トランザクションのコミットに失敗しました", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func adminLogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "admin_token",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "logged out"})
}
