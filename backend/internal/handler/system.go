//backend/internal/handler/system.go
package handler

import (
	"net/http"
	"os"
)

func (h *Handler) getPredictionHandler(w http.ResponseWriter, r *http.Request) {
	data := h.cache.GetPredictionData()
	if data == nil {
		http.Error(w, "予測データはまだ利用できません。", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func (h *Handler) getDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 || pathSegments[2] == "" {
		http.Error(w, "日付が指定されていません", http.StatusBadRequest)
		return
	}
	dateStr := pathSegments[2]
	data, ok := h.cache.GetDetailData(dateStr)
	if !ok {
		http.Error(w, "指定された日付のデータは見つかりません", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func (h *Handler) refreshCacheHandler(w http.ResponseWriter, r *http.Request) {
	secretHeader := r.Header.Get("X-Cron-Secret")
	expectedSecret := os.Getenv("CRON_SECRET_KEY")
	if expectedSecret == "" || secretHeader != expectedSecret {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	go h.cache.FetchAndCachePredictionData()
	go h.cache.FetchAndCacheDetailData()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Cache refresh triggered."))
}