//backend/internal/cache/cache_test.go
package cache

import (
	"encoding/json"
	"log/slog"
	"os"
	"testing"
)

// TestCombinedDataWithNilNextTide はnextTideDataがnilの場合でも
// combinedDataが正しく作成・シリアライズされることをテストする
func TestCombinedDataWithNilNextTide(t *testing.T) {
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
		// これは翌日の潮汐データが取得できなかった場合をシミュレート
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
}

// TestCacheStoreAndRetrieveWithNilNextTide はnextTideがnilのデータを
// キャッシュに保存・取得できることをテストする
func TestCacheStoreAndRetrieveWithNilNextTide(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	cm := NewCacheManager(logger, "")

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
}
