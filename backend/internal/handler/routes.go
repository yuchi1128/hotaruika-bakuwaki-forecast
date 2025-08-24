//backend/internal/handler/routes.go
package handler

import (
	"database/sql"
	"log/slog"
	"net/http"
	"strings"

	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/cache"
)

// Handler はハンドラ関数で共有する依存関係を保持
type Handler struct {
	db     *sql.DB
	logger *slog.Logger
	jwtKey []byte
	cache  *cache.CacheManager
}

// NewHandler は新しいHandlerを初期化
func NewHandler(db *sql.DB, logger *slog.Logger, jwtKey []byte, cache *cache.CacheManager) *Handler {
	return &Handler{
		db:     db,
		logger: logger,
		jwtKey: jwtKey,
		cache:  cache,
	}
}

// RegisterRoutes はサーバーの全ルートを登録
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/prediction", h.getPredictionHandler)
	mux.HandleFunc("/api/detail/", h.getDetailHandler)
	mux.HandleFunc("/api/posts", h.postsHandler)
	mux.HandleFunc("/api/posts/", h.postDetailHandler)
	mux.HandleFunc("/api/replies/", h.replyDetailHandler)
	mux.HandleFunc("/api/admin/login", h.adminLoginHandler)
	mux.HandleFunc("/api/admin/logout", h.adminLogoutHandler)
	mux.HandleFunc("/api/tasks/refresh-cache", h.refreshCacheHandler)
}

// splitPath はURLパスを'/'で分割
func splitPath(path string) []string {
	return strings.FieldsFunc(path, func(r rune) bool {
		return r == '/'
	})
}