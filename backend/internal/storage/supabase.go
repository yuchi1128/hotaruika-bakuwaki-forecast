//backend/internal/storage/supabase.go
package storage

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"
)

// UploadFileToSupabase はSupabase Storageにファイルをアップロードする
func UploadFileToSupabase(logger *slog.Logger, bucketName, fileName string, fileData []byte, mimeType string) error {
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

// DeleteFileFromSupabase はSupabase Storageからファイルを削除する
func DeleteFileFromSupabase(logger *slog.Logger, bucketName string, fileNames []string) error {
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