package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"sync"

	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/model"
)

var (
	banMu         sync.RWMutex
	bannedDevices = make(map[string]bool)
)

// DBからBANリストをメモリに読み込む
func loadBannedDevices(db *sql.DB) error {
	rows, err := db.Query("SELECT device_id FROM banned_devices")
	if err != nil {
		return err
	}
	defer rows.Close()

	newCache := make(map[string]bool)
	for rows.Next() {
		var deviceID string
		if err := rows.Scan(&deviceID); err != nil {
			continue
		}
		newCache[deviceID] = true
	}

	banMu.Lock()
	bannedDevices = newCache
	banMu.Unlock()
	return rows.Err()
}

// デバイスIDがBANされているか確認する
func isDeviceBanned(deviceID string) bool {
	banMu.RLock()
	defer banMu.RUnlock()
	return bannedDevices[deviceID]
}

// リクエストのデバイスIDがBANされていないか確認する
// falseを返しレスポンスを書き込む
func checkBanStatus(w http.ResponseWriter, r *http.Request) bool {
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		return true // デバイスIDなしは通す（レート制限でIP制限がかかる）
	}
	if isDeviceBanned(deviceID) {
		http.Error(w, "投稿できません", http.StatusForbidden)
		return false
	}
	return true
}

// BANリストを取得する (GET /api/admin/banned-devices)
func (h *Handler) listBannedDevicesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		return
	}

	rows, err := h.db.Query("SELECT id, device_id, reason, banned_at FROM banned_devices ORDER BY banned_at DESC")
	if err != nil {
		h.logger.Error("BANリスト取得エラー", "error", err)
		http.Error(w, "BANリストの取得に失敗しました", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var bans []model.BannedDevice
	for rows.Next() {
		var b model.BannedDevice
		if err := rows.Scan(&b.ID, &b.DeviceID, &b.Reason, &b.BannedAt); err != nil {
			h.logger.Error("BANリストスキャンエラー", "error", err)
			continue
		}
		bans = append(bans, b)
	}

	if bans == nil {
		bans = []model.BannedDevice{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bans)
}

// デバイスをBANする (POST /api/admin/ban)
func (h *Handler) banDeviceHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		DeviceID string  `json:"device_id"`
		Reason   *string `json:"reason,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "リクエストボディが不正です", http.StatusBadRequest)
		return
	}

	req.DeviceID = strings.TrimSpace(req.DeviceID)
	if req.DeviceID == "" {
		http.Error(w, "デバイスIDが必要です", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(
		"INSERT INTO banned_devices (device_id, reason) VALUES ($1, $2) ON CONFLICT (device_id) DO NOTHING",
		req.DeviceID, req.Reason,
	)
	if err != nil {
		h.logger.Error("デバイスBANエラー", "error", err)
		http.Error(w, "BANに失敗しました", http.StatusInternalServerError)
		return
	}

	if err := loadBannedDevices(h.db); err != nil {
		h.logger.Error("BANキャッシュ更新エラー", "error", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "banned"})
}

// デバイスのBANを解除する (DELETE /api/admin/ban/{deviceId})
func (h *Handler) unbanDeviceHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		return
	}

	parts := splitPath(r.URL.Path)
	// /api/admin/ban/{deviceId} → ["api", "admin", "ban", "{deviceId}"]
	if len(parts) < 4 {
		http.Error(w, "デバイスIDが指定されていません", http.StatusBadRequest)
		return
	}
	deviceID := parts[3]

	result, err := h.db.Exec("DELETE FROM banned_devices WHERE device_id = $1", deviceID)
	if err != nil {
		h.logger.Error("BAN解除エラー", "error", err)
		http.Error(w, "BAN解除に失敗しました", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "BANリストにありません", http.StatusNotFound)
		return
	}

	if err := loadBannedDevices(h.db); err != nil {
		h.logger.Error("BANキャッシュ更新エラー", "error", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "unbanned"})
}
