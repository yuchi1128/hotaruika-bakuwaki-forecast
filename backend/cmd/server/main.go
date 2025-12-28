// backend/cmd/server/main.go
package main

import (
	"database/sql"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/cache"
	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/handler"
)

func main() {
	// .envファイルの読み込み
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file, using environment variables from OS")
	}

	// ロガーの初期化
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	// opts := &slog.HandlerOptions{
	// 	Level: slog.LevelDebug, // ← DEBUGレベルのログも出力するように設定
	// }
	// logger := slog.New(slog.NewJSONHandler(os.Stdout, opts))

	// 環境変数の読み込みと検証
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		logger.Warn("環境変数ADMIN_PASSWORDが設定されていません。管理者機能は無効になります。")
	}
	jwtSecret := os.Getenv("JWT_SECRET_KEY")
	if jwtSecret == "" {
		logger.Error("環境変数JWT_SECRET_KEYが設定されていません")
		os.Exit(1)
	}
	jwtKey := []byte(jwtSecret)

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		logger.Error("環境変数DATABASE_URLが設定されていません")
		os.Exit(1)
	}

	predictionURL := os.Getenv("PREDICTION_API_URL")
	if predictionURL == "" {
		logger.Error("環境変数PREDICTION_API_URLが設定されていません")
		os.Exit(1)
	}

	// データベース接続の初期化
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		logger.Error("データベースのオープンエラー", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// 接続プールの設定
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxIdleTime(2 * time.Minute)

	if err = db.Ping(); err != nil {
		logger.Error("データベースへの接続エラー", "error", err)
		os.Exit(1)
	}
	logger.Info("データベースに正常に接続しました！")

	// キャッシュマネージャーの初期化と初回データ取得
	cacheManager := cache.NewCacheManager(logger, predictionURL)
	go cacheManager.FetchAndCachePredictionData()
	go cacheManager.FetchAndCacheDetailData()

	// HTTPハンドラの初期化
	h := handler.NewHandler(db, logger, jwtKey, cacheManager)

	// ルーターの設定
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "こんにちは、バックエンドです！")
	})

	// CORSの設定
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

	// サーバーの起動
	logger.Info("サーバーをポート8080で起動します...")
	if err := http.ListenAndServe(":8080", corsHandler); err != nil {
		logger.Error("サーバーの起動に失敗しました", "error", err)
		os.Exit(1)
	}
}
