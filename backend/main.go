package main

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"github.com/lib/pq"
	"github.com/rs/cors"
	"github.com/cenkalti/backoff/v4"
)

var db *sql.DB
var logger *slog.Logger
var jwtKey []byte

var predictionCache struct {
	sync.RWMutex
	data []byte
}

var detailCache struct {
	sync.RWMutex
	data map[string][]byte
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
	ID             int     `json:"id"`
	PostID         int     `json:"post_id"`
	ParentReplyID  *int    `json:"parent_reply_id"`
	Username       string  `json:"username"`
	Content        string  `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
	GoodCount      int     `json:"good_count"`
	BadCount       int     `json:"bad_count"`
	ParentUsername *string `json:"parent_username,omitempty"`
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
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, using environment variables from OS")
	}

	logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

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

	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		logger.Error("データベースのオープンエラー", "error", err)
		os.Exit(1)
	}

	// ★★★ 接続プールの設定を追加 ★★★
	db.SetConnMaxLifetime(5 * time.Minute) // 接続を再利用する最大時間
	db.SetMaxOpenConns(10)                  // オープンな接続の最大数
	db.SetMaxIdleConns(5)                   // アイドルな接続の最大数
	db.SetConnMaxIdleTime(2 * time.Minute)  // アイドル接続を維持する最大時間

	err = db.Ping()
	if err != nil {
		logger.Error("データベースへの接続エラー", "error", err)
		os.Exit(1)
	}
	logger.Info("データベースに正常に接続しました！")

	detailCache.data = make(map[string][]byte)
	go fetchAndCachePredictionData()
	go fetchAndCacheDetailData()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/prediction", getPredictionHandler)
	mux.HandleFunc("/api/detail/", getDetailHandler)
	mux.HandleFunc("/api/posts", postsHandler)
	mux.HandleFunc("/api/posts/", postDetailHandler)
	mux.HandleFunc("/api/replies/", replyDetailHandler)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))
	mux.HandleFunc("/api/admin/login", adminLoginHandler)
	mux.HandleFunc("/api/admin/logout", adminLogoutHandler)
	mux.HandleFunc("/api/tasks/refresh-cache", refreshCacheHandler)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "こんにちは、バックエンドです！")
	})

	allowedOriginsStr := os.Getenv("ALLOWED_ORIGINS")
	var allowedOrigins []string
	if allowedOriginsStr != "" {
		allowedOrigins = strings.Split(allowedOriginsStr, ",")
	} else {
		allowedOrigins = []string{"http://localhost:3000", "http://localhost:3001", "https://bakuwaki-yoho.com"}
	}
	logger.Info("CORS AllowedOriginsを設定しました", "origins", allowedOrigins)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
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

// (uploadFileToSupabase, deleteFileFromSupabase, createPost, deleteItemは変更なし)
func uploadFileToSupabase(bucketName, fileName string, fileData []byte, mimeType string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", os.Getenv("SUPABASE_URL"), bucketName, fileName)
	key := os.Getenv("SUPABASE_SERVICE_KEY")
	req, err := http.NewRequest("POST", url, bytes.NewReader(fileData))
	if err != nil {
		return fmt.Errorf("リクエスト作成失敗: %w", err)
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", mimeType)
	client := &http.Client{Timeout: time.Second * 10}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("リクエスト実行失敗: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("アップロード失敗: status=%s, body=%s", resp.Status, string(body))
	}
	logger.Info("Supabaseへのファイルアップロード成功", "filename", fileName)
	return nil
}

func deleteFileFromSupabase(bucketName string, fileNames []string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s", os.Getenv("SUPABASE_URL"), bucketName)
	key := os.Getenv("SUPABASE_SERVICE_KEY")
	bodyJSON, err := json.Marshal(map[string][]string{"prefixes": fileNames})
	if err != nil {
		return fmt.Errorf("JSONボディ作成失敗: %w", err)
	}
	req, err := http.NewRequest("DELETE", url, bytes.NewReader(bodyJSON))
	if err != nil {
		return fmt.Errorf("リクエスト作成失敗: %w", err)
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: time.Second * 10}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("リクエスト実行失敗: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("ファイル削除失敗: status=%s, body=%s", resp.Status, string(body))
	}
	logger.Info("Supabaseからのファイル削除成功", "filenames", fileNames)
	return nil
}

func createPost(w http.ResponseWriter, r *http.Request, isAdmin bool) {
	var post Post
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		http.Error(w, "不正なリクエストです", http.StatusBadRequest)
		return
	}

	if isAdmin {
		if post.Label != "現地情報" && post.Label != "その他" && post.Label != "管理者" {
			http.Error(w, "不正なラベルです", http.StatusBadRequest)
			return
		}
	} else {
		if post.Label == "管理者" {
			http.Error(w, "管理者ラベルは使用できません", http.StatusForbidden)
			return
		}
		if post.Label != "現地情報" && post.Label != "その他" {
			http.Error(w, "不正なラベルです", http.StatusBadRequest)
			return
		}
	}

	var imageURLs []string
	if len(post.ImageURLs) > 0 {
		for _, dataURL := range post.ImageURLs {
			parts := strings.SplitN(dataURL, ";base64,", 2)
			if len(parts) != 2 {
				http.Error(w, "画像データが不正です", http.StatusBadRequest)
				return
			}
			mimeType := strings.TrimPrefix(parts[0], "data:")
			extension := "jpeg"
			if strings.Contains(mimeType, "png") {
				extension = "png"
			}
			decoded, err := base64.StdEncoding.DecodeString(parts[1])
			if err != nil {
				http.Error(w, "画像のデコードに失敗しました", http.StatusInternalServerError)
				return
			}
			filename := fmt.Sprintf("%d.%s", time.Now().UnixNano(), extension)

			if err := uploadFileToSupabase("post-images", filename, decoded, mimeType); err != nil {
				logger.Error("画像のアップロードに失敗しました", "error", err)
				http.Error(w, "画像のアップロードに失敗しました", http.StatusInternalServerError)
				return
			}
			publicURL := fmt.Sprintf("%s/storage/v1/object/public/post-images/%s", os.Getenv("SUPABASE_URL"), filename)
			imageURLs = append(imageURLs, publicURL)
		}
	}

	query := `INSERT INTO posts (username, content, image_urls, label) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	if err := db.QueryRow(query, post.Username, post.Content, pq.Array(imageURLs), post.Label).Scan(&post.ID, &post.CreatedAt); err != nil {
		logger.Error("投稿の挿入エラー", "error", err)
		http.Error(w, "投稿の作成に失敗しました", http.StatusInternalServerError)
		return
	}

	post.ImageURLs = imageURLs
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func deleteItem(w http.ResponseWriter, r *http.Request, itemType string, itemID int) {
	var tableName, imageColumn string
	if itemType == "posts" {
		tableName, imageColumn = "posts", "image_urls"
	} else if itemType == "replies" {
		tableName = "replies"
	} else {
		http.Error(w, "不正なアイテムタイプです", http.StatusBadRequest)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		logger.Error("トランザクション開始エラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	if imageColumn != "" {
		var imageURLs pq.StringArray
		query := fmt.Sprintf("SELECT %s FROM %s WHERE id = $1", imageColumn, tableName)
		if err := tx.QueryRow(query, itemID).Scan(&imageURLs); err != nil && err != sql.ErrNoRows {
			logger.Error("画像URLのクエリエラー", "error", err)
			http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
			return
		}
		if len(imageURLs) > 0 {
			fileNames := make([]string, len(imageURLs))
			for i, url := range imageURLs {
				fileNames[i] = filepath.Base(url)
			}
			if err := deleteFileFromSupabase("post-images", fileNames); err != nil {
				logger.Warn("Supabaseからの画像ファイル削除に失敗しました", "filenames", fileNames, "error", err)
			}
		}
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE id = $1", tableName)
	if _, err := tx.Exec(query, itemID); err != nil {
		logger.Error("DBからのアイテム削除エラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		logger.Error("トランザクションのコミットエラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func getPosts(w http.ResponseWriter, r *http.Request) {
	var posts []Post

	operation := func() error {
		baseQuery := `SELECT p.id, p.username, p.content, p.image_urls, p.label, p.created_at, COALESCE(r_good.count, 0) as good_count, COALESCE(r_bad.count, 0) as bad_count FROM posts p LEFT JOIN (SELECT post_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY post_id) r_good ON p.id = r_good.post_id LEFT JOIN (SELECT post_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY post_id) r_bad ON p.id = r_bad.post_id`
		var args []interface{}
		query := ""
		label := r.URL.Query().Get("label")
		if label != "" {
			query = baseQuery + " WHERE p.label = $1 ORDER BY p.created_at DESC"
			args = append(args, label)
		} else {
			query = baseQuery + " ORDER BY p.created_at DESC"
		}

		rows, err := db.Query(query, args...)
		if err != nil {
			logger.Error("投稿のクエリエラー（リトライ中）", "error", err)
			return err
		}
		defer rows.Close()

		posts = []Post{}
		for rows.Next() {
			var post Post
			if err := rows.Scan(&post.ID, &post.Username, &post.Content, pq.Array(&post.ImageURLs), &post.Label, &post.CreatedAt, &post.GoodCount, &post.BadCount); err != nil {
				logger.Error("投稿行のスキャンエラー", "error", err)
				continue
			}
			posts = append(posts, post)
		}
		return rows.Err()
	}
	
	err := backoff.Retry(operation, backoff.WithMaxRetries(backoff.NewExponentialBackOff(), 3))

	if err != nil {
		logger.Error("投稿の取得に失敗しました（リトライ上限到達）", "error", err)
		http.Error(w, "投稿の取得に失敗しました", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func getRepliesForPost(w http.ResponseWriter, r *http.Request, postID int) {
	var replies []Reply

	// リトライ処理を定義
	operation := func() error {
		query := `SELECT r.id, r.post_id, r.parent_reply_id, r.username, r.content, r.created_at, COALESCE(r_good.count, 0) as good_count, COALESCE(r_bad.count, 0) as bad_count, COALESCE(pr.username, p.username) as parent_username FROM replies r LEFT JOIN posts p ON r.post_id = p.id LEFT JOIN replies pr ON r.parent_reply_id = pr.id LEFT JOIN (SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY reply_id) r_good ON r.id = r_good.reply_id LEFT JOIN (SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY reply_id) r_bad ON r.id = r_bad.reply_id WHERE r.post_id = $1 ORDER BY r.created_at ASC`
		
		rows, err := db.Query(query, postID)
		if err != nil {
			logger.Error("返信のクエリエラー（リトライ中）", "error", err)
			return err // エラーを返してリトライさせる
		}
		defer rows.Close()

		// repliesスライスをリセット
		replies = []Reply{}
		for rows.Next() {
			var reply Reply
			var parentReplyID sql.NullInt64
			var parentUsername sql.NullString
			if err := rows.Scan(&reply.ID, &reply.PostID, &parentReplyID, &reply.Username, &reply.Content, &reply.CreatedAt, &reply.GoodCount, &reply.BadCount, &parentUsername); err != nil {
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
		return rows.Err() // forループ後のエラーチェック
	}

	// 最大3回までリトライを実行
	err := backoff.Retry(operation, backoff.WithMaxRetries(backoff.NewExponentialBackOff(), 3))

	if err != nil {
		logger.Error("返信の取得に失敗しました（リトライ上限到達）", "error", err)
		http.Error(w, "返信の取得に失敗しました", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(replies)
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
		http.Error(w, "予測データはまだ利用できません。", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func fetchAndCacheDetailData() {
	logger.Info("詳細データの取得を開始します")
	var wg sync.WaitGroup
	jst, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		logger.Error("JSTタイムゾーンの読み込みに失敗しました", "error", err)
		return
	}
	for i := -1; i < 7; i++ {
		wg.Add(1)
		time.Sleep(250 * time.Millisecond)
		go func(dayOffset int) {
			defer wg.Done()
			targetDate := time.Now().In(jst).AddDate(0, 0, dayOffset)
			dateStr := targetDate.Format("2006-01-02")
			weatherData, err := fetchWeatherData(targetDate)
			if err != nil {
				logger.Error("気象データの取得に失敗しました", "date", dateStr, "error", err)
				return
			}
			tideData, err := fetchTideData(targetDate)
			if err != nil {
				logger.Error("潮汐データの取得に失敗しました", "date", dateStr, "error", err)
				return
			}
			combinedData := map[string]interface{}{"weather": weatherData, "tide": tideData}
			jsonData, err := json.Marshal(combinedData)
			if err != nil {
				logger.Error("詳細データのJSONシリアライズに失敗しました", "date", dateStr, "error", err)
				return
			}
			detailCache.Lock()
			detailCache.data[dateStr] = jsonData
			detailCache.Unlock()
			logger.Info("詳細データを正常に取得しキャッシュしました", "date", dateStr)
		}(i)
	}
	wg.Wait()
	logger.Info("詳細データの取得が完了しました")
}

func fetchWeatherData(targetDate time.Time) (map[string]interface{}, error) {
	startDate := targetDate.Format("2006-01-02")
	endDate := targetDate.AddDate(0, 0, 1).Format("2006-01-02")
	weatherApiUrl := fmt.Sprintf("https://api.open-meteo.com/v1/forecast?latitude=36.76&longitude=137.24&hourly=temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia%%2FTokyo&wind_speed_unit=ms&start_date=%s&end_date=%s", startDate, endDate)
	resp, err := http.Get(weatherApiUrl)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("気象APIが正常なステータスを返しませんでした: %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}
	return data, nil
}

func fetchTideData(targetDate time.Time) (map[string]interface{}, error) {
	year := targetDate.Year()
	month := int(targetDate.Month())
	day := targetDate.Day()
	tideApiUrl := fmt.Sprintf("https://tide736.net/api/get_tide.php?pc=16&hc=3&yr=%d&mn=%d&dy=%d&rg=day", year, month, day)
	resp, err := http.Get(tideApiUrl)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("潮汐APIが正常なステータスを返しませんでした: %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}
	return data, nil
}

func getDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 || pathSegments[2] == "" {
		http.Error(w, "日付が指定されていません", http.StatusBadRequest)
		return
	}
	dateStr := pathSegments[2]
	detailCache.RLock()
	data, ok := detailCache.data[dateStr]
	detailCache.RUnlock()
	if !ok {
		http.Error(w, "指定された日付のデータは見つかりません", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
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
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
	})
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("admin_token")
		if err != nil {
			http.Error(w, "認証されていません", http.StatusUnauthorized)
			return
		}
		tokenString := cookie.Value
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})
		if err != nil || !token.Valid || claims.Role != "admin" {
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
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) { return jwtKey, nil })
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
	if len(pathSegments) < 3 {
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
	if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodGet:
			getRepliesForPost(w, r, postID)
		case http.MethodPost:
			createReplyToPost(w, r, postID)
		default:
			http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		}
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		createPostReaction(w, r, postID)
	} else {
		http.Error(w, "見つかりません", http.StatusNotFound)
	}
}

func replyDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 {
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
		createReplyToReply(w, r, replyID)
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		createReplyReaction(w, r, replyID)
	} else {
		http.Error(w, "見つかりません", http.StatusNotFound)
	}
}

func createReplyToPost(w http.ResponseWriter, r *http.Request, postID int) {
	var reply Reply
	json.NewDecoder(r.Body).Decode(&reply)
	query := `INSERT INTO replies (post_id, username, content) VALUES ($1, $2, $3) RETURNING id, created_at`
	err := db.QueryRow(query, postID, reply.Username, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		logger.Error("投稿への返信エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusInternalServerError)
		return
	}
	reply.PostID = postID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func createReplyToReply(w http.ResponseWriter, r *http.Request, parentReplyID int) {
	var reply Reply
	json.NewDecoder(r.Body).Decode(&reply)
	var postID int
	err := db.QueryRow("SELECT post_id FROM replies WHERE id = $1", parentReplyID).Scan(&postID)
	if err != nil {
		logger.Error("親返信の取得エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusNotFound)
		return
	}
	query := `INSERT INTO replies (post_id, parent_reply_id, username, content) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err = db.QueryRow(query, postID, parentReplyID, reply.Username, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		logger.Error("返信への返信エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusInternalServerError)
		return
	}
	reply.PostID = postID
	reply.ParentReplyID = &parentReplyID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func createPostReaction(w http.ResponseWriter, r *http.Request, postID int) {
	var reaction Reaction
	json.NewDecoder(r.Body).Decode(&reaction)
	query := `INSERT INTO reactions (post_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err := db.QueryRow(query, postID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		logger.Error("投稿へのリアクションエラー", "error", err)
		http.Error(w, "リアクションできませんでした", http.StatusInternalServerError)
		return
	}
	reaction.PostID = &postID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

func createReplyReaction(w http.ResponseWriter, r *http.Request, replyID int) {
	var reaction Reaction
	json.NewDecoder(r.Body).Decode(&reaction)
	query := `INSERT INTO reactions (reply_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err := db.QueryRow(query, replyID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		logger.Error("返信へのリアクションエラー", "error", err)
		http.Error(w, "リアクションできませんでした", http.StatusInternalServerError)
		return
	}
	reaction.ReplyID = &replyID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

func splitPath(path string) []string {
	return strings.FieldsFunc(path, func(r rune) bool {
		return r == '/'
	})
}

func adminLogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name: "admin_token", Value: "", Expires: time.Unix(0, 0), HttpOnly: true, Path: "/", SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "logged out"})
}

func refreshCacheHandler(w http.ResponseWriter, r *http.Request) {
	secretHeader := r.Header.Get("X-Cron-Secret")
	expectedSecret := os.Getenv("CRON_SECRET_KEY")
	if expectedSecret == "" || secretHeader != expectedSecret {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	go fetchAndCachePredictionData()
	go fetchAndCacheDetailData()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Cache refresh triggered."))
}