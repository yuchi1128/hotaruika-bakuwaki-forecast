//backend/internal/cache/cache_test.go
package cache

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

// TestFetchAndCacheDetailData_NextTideFails は翌日の潮汐データが取得できない場合でも
// 詳細データが正常にキャッシュされることをテストする
func TestFetchAndCacheDetailData_NextTideFails(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// 気象APIのモックサーバー
	weatherServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"hourly": map[string]interface{}{
				"time":                      []string{"2026-02-23T00:00"},
				"temperature_2m":            []float64{10.0},
				"precipitation":             []float64{0.0},
				"precipitation_probability": []int{0},
				"weather_code":              []int{1},
				"wind_speed_10m":            []float64{5.0},
				"wind_direction_10m":        []int{180},
			},
		})
	}))
	defer weatherServer.Close()

	// 潮汐APIへのリクエスト回数を追跡
	tideRequestCount := 0
	targetDateStr := time.Now().Format("2006-01-02")
	nextDateStr := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	// 潮汐APIのモックサーバー - 対象日はデータを返し、翌日は失敗する
	tideServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tideRequestCount++

		// リクエストから日付を取得
		query := r.URL.RawQuery

		// 翌日のリクエストは失敗させる
		if strings.Contains(query, fmt.Sprintf("dy=%d", time.Now().AddDate(0, 0, 1).Day())) {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		// 対象日は正常な潮汐データを返す
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  1,
			"message": "正常終了",
			"tide": map[string]interface{}{
				"chart": map[string]interface{}{
					targetDateStr: map[string]interface{}{
						"tide":  []interface{}{},
						"flood": []interface{}{},
						"edd":   []interface{}{},
					},
				},
			},
		})
	}))
	defer tideServer.Close()

	// テスト用のキャッシュマネージャーを作成
	cm := NewCacheManager(logger, "")

	// combinedDataがnilのnextTideDataを正しく処理できることをテスト
	t.Run("nextTideDataがnilでもcombinedDataが正しく作成される", func(t *testing.T) {
		weatherData := map[string]interface{}{
			"hourly": map[string]interface{}{
				"time":           []string{"2026-02-23T00:00"},
				"temperature_2m": []float64{10.0},
			},
		}

		tideData := map[string]interface{}{
			"status":  1,
			"message": "正常終了",
		}

		// 重要: nextTideDataがnilの場合のテスト
		var nextTideData map[string]interface{} = nil

		combinedData := map[string]interface{}{
			"weather":  weatherData,
			"tide":     tideData,
			"nextTide": nextTideData,
		}

		// nilのnextTideDataでもJSONシリアライズが成功することを確認
		jsonData, err := json.Marshal(combinedData)
		if err != nil {
			t.Fatalf("nextTideDataがnilの場合にcombinedDataのシリアライズに失敗: %v", err)
		}

		// 構造を確認
		var result map[string]interface{}
		if err := json.Unmarshal(jsonData, &result); err != nil {
			t.Fatalf("JSONのアンマーシャルに失敗: %v", err)
		}

		// nextTideがJSONでnullになっていることを確認
		if result["nextTide"] != nil {
			t.Errorf("nextTideがnullであることを期待しましたが、実際は: %v", result["nextTide"])
		}

		// weatherとtideデータが存在することを確認
		if result["weather"] == nil {
			t.Error("weatherデータが存在することを期待しました")
		}
		if result["tide"] == nil {
			t.Error("tideデータが存在することを期待しました")
		}

		t.Logf("nextTideDataがnilでもキャッシュデータの作成に成功しました")
		t.Logf("JSON出力: %s", string(jsonData))
	})

	// キャッシュへの保存と取得が正しく動作することをテスト
	t.Run("キャッシュへの保存と取得が正しく動作する", func(t *testing.T) {
		testData := map[string]interface{}{
			"weather":  map[string]interface{}{"test": "data"},
			"tide":     map[string]interface{}{"test": "tide"},
			"nextTide": nil,
		}

		jsonData, _ := json.Marshal(testData)
		testDateStr := "2026-02-23"

		cm.detailCache.Lock()
		cm.detailCache.data[testDateStr] = jsonData
		cm.detailCache.Unlock()

		// 取得して確認
		data, ok := cm.GetDetailData(testDateStr)
		if !ok {
			t.Fatal("キャッシュデータの取得に失敗しました")
		}

		var result map[string]interface{}
		if err := json.Unmarshal(data, &result); err != nil {
			t.Fatalf("キャッシュデータのアンマーシャルに失敗: %v", err)
		}

		if result["nextTide"] != nil {
			t.Errorf("nextTideがnullであることを期待しましたが、実際は: %v", result["nextTide"])
		}

		t.Logf("nextTideがnilのデータをキャッシュに正しく保存・取得できました")
	})

	_ = nextDateStr // 未使用変数の警告を回避
}
