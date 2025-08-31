//backend/internal/cache/cache.go
package cache

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

// CacheManager は予測データと詳細データのキャッシュを管理
type CacheManager struct {
	logger        *slog.Logger
	predictionURL string
	predictionCache struct {
		sync.RWMutex
		data []byte
	}
	detailCache struct {
		sync.RWMutex
		data map[string][]byte
	}
}

// NewCacheManager は新しいCacheManagerを初期化する
func NewCacheManager(logger *slog.Logger, predictionURL string) *CacheManager {
	cm := &CacheManager{
		logger:        logger,
		predictionURL: predictionURL,
	}
	cm.detailCache.data = make(map[string][]byte)
	return cm
}

// FetchAndCachePredictionData は予測データを取得しキャッシュする
func (c *CacheManager) FetchAndCachePredictionData() {
	c.logger.Info("予測データの取得を試みています", "url", c.predictionURL)
	resp, err := http.Get(c.predictionURL)
	if err != nil {
		c.logger.Error("予測データの取得に失敗しました", "error", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		c.logger.Error("予測APIが正常なステータスを返しませんでした", "status_code", resp.StatusCode)
		return
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("予測APIのレスポンスボディの読み取りに失敗しました", "error", err)
		return
	}
	if !json.Valid(body) {
		c.logger.Error("取得した予測データは有効なJSONではありません")
		return
	}
	c.predictionCache.Lock()
	c.predictionCache.data = body
	c.predictionCache.Unlock()
	c.logger.Info("新しい予測データを正常に取得し、キャッシュしました")
}

// FetchAndCacheDetailData は詳細データを取得しキャッシュする
func (c *CacheManager) FetchAndCacheDetailData() {
	c.logger.Info("詳細データの取得を開始します")
	var wg sync.WaitGroup
	jst, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		c.logger.Error("JSTタイムゾーンの読み込みに失敗しました", "error", err)
		return
	}
	for i := -1; i < 7; i++ {
		wg.Add(1)
		time.Sleep(250 * time.Millisecond) // APIへの負荷軽減
		go func(dayOffset int) {
			defer wg.Done()
			targetDate := time.Now().In(jst).AddDate(0, 0, dayOffset)
			dateStr := targetDate.Format("2006-01-02")
			weatherData, err := c.fetchWeatherData(targetDate)
			if err != nil {
				c.logger.Error("気象データの取得に失敗しました", "date", dateStr, "error", err)
				return
			}
			// 対象日の潮汐データを取得
			tideData, err := c.fetchTideData(targetDate)
			if err != nil {
				c.logger.Error("潮汐データの取得に失敗しました", "date", dateStr, "error", err)
				return
			}

			// 翌日の潮汐データを取得
			nextDate := targetDate.AddDate(0, 0, 1)
			nextTideData, err := c.fetchTideData(nextDate)
			if err != nil {
				c.logger.Error("翌日の潮汐データの取得に失敗しました", "date", nextDate.Format("2006-01-02"), "error", err)
				return // 翌日のデータがなければ28時間表示ができないため、ここで処理を中断
			}

			// 2日分の潮汐データをまとめて格納
			combinedData := map[string]interface{}{
				"weather":  weatherData,
				"tide":     tideData,
				"nextTide": nextTideData, // 翌日の潮汐データを追加
			}
			jsonData, err := json.Marshal(combinedData)
			if err != nil {
				c.logger.Error("詳細データのJSONシリアライズに失敗しました", "date", dateStr, "error", err)
				return
			}
			c.detailCache.Lock()
			c.detailCache.data[dateStr] = jsonData
			c.detailCache.Unlock()
			c.logger.Info("詳細データを正常に取得しキャッシュしました", "date", dateStr)
		}(i)
	}
	wg.Wait()
	c.logger.Info("詳細データの取得が完了しました")
}

func (c *CacheManager) fetchWeatherData(targetDate time.Time) (map[string]interface{}, error) {
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

func (c *CacheManager) fetchTideData(targetDate time.Time) (map[string]interface{}, error) {
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

// GetPredictionData はキャッシュされた予測データを返す
func (c *CacheManager) GetPredictionData() []byte {
	c.predictionCache.RLock()
	defer c.predictionCache.RUnlock()
	return c.predictionCache.data
}

// GetDetailData はキャッシュされた指定日の詳細データを返す
func (c *CacheManager) GetDetailData(dateStr string) ([]byte, bool) {
	c.detailCache.RLock()
	defer c.detailCache.RUnlock()
	data, ok := c.detailCache.data[dateStr]
	return data, ok
}