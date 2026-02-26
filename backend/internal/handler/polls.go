// backend/internal/handler/polls.go
package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/lib/pq"
	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/model"
)

func (h *Handler) pollHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	// /api/polls/{optionId}/vote
	if len(pathSegments) != 4 || pathSegments[3] != "vote" {
		http.Error(w, "見つかりません", http.StatusNotFound)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		return
	}

	optionID, err := strconv.Atoi(pathSegments[2])
	if err != nil {
		http.Error(w, "選択肢IDが不正です", http.StatusBadRequest)
		return
	}

	h.votePollOption(w, r, optionID)
}

func (h *Handler) votePollOption(w http.ResponseWriter, _ *http.Request, optionID int) {
	// 選択肢の存在確認と期限チェック
	var pollID int
	var expiresAt time.Time
	query := `SELECT po.poll_id, p.expires_at
		FROM poll_options po
		JOIN polls p ON po.poll_id = p.id
		WHERE po.id = $1`
	err := h.db.QueryRow(query, optionID).Scan(&pollID, &expiresAt)
	if err == sql.ErrNoRows {
		http.Error(w, "選択肢が見つかりません", http.StatusNotFound)
		return
	}
	if err != nil {
		h.logger.Error("投票前の確認エラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}

	if time.Now().After(expiresAt) {
		http.Error(w, "このアンケートは終了しました", http.StatusBadRequest)
		return
	}

	// トランザクションで投票カウントをインクリメント
	tx, err := h.db.Begin()
	if err != nil {
		h.logger.Error("トランザクション開始エラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1`, optionID); err != nil {
		h.logger.Error("投票カウント更新エラー", "error", err)
		http.Error(w, "投票に失敗しました", http.StatusInternalServerError)
		return
	}

	if _, err := tx.Exec(`UPDATE polls SET total_votes = total_votes + 1 WHERE id = $1`, pollID); err != nil {
		h.logger.Error("総投票数更新エラー", "error", err)
		http.Error(w, "投票に失敗しました", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		h.logger.Error("トランザクションコミットエラー", "error", err)
		http.Error(w, "投票に失敗しました", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// getPollsForPosts は複数の投稿IDに対するアンケートデータを一括取得する
func (h *Handler) getPollsForPosts(postIDs []int) (map[int]*model.Poll, error) {
	pollsMap := make(map[int]*model.Poll)
	if len(postIDs) == 0 {
		return pollsMap, nil
	}

	query := `SELECT id, post_id, expires_at, total_votes, created_at
		FROM polls WHERE post_id = ANY($1)`
	rows, err := h.db.Query(query, pq.Array(postIDs))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pollIDs []int
	pollIDToPostID := make(map[int]int)
	for rows.Next() {
		var poll model.Poll
		if err := rows.Scan(&poll.ID, &poll.PostID, &poll.ExpiresAt, &poll.TotalVotes, &poll.CreatedAt); err != nil {
			continue
		}
		poll.Options = []model.PollOption{}
		pollsMap[poll.PostID] = &poll
		pollIDs = append(pollIDs, poll.ID)
		pollIDToPostID[poll.ID] = poll.PostID
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(pollIDs) == 0 {
		return pollsMap, nil
	}

	optQuery := `SELECT id, poll_id, option_text, vote_count, display_order
		FROM poll_options WHERE poll_id = ANY($1) ORDER BY display_order`
	optRows, err := h.db.Query(optQuery, pq.Array(pollIDs))
	if err != nil {
		return nil, err
	}
	defer optRows.Close()

	for optRows.Next() {
		var opt model.PollOption
		if err := optRows.Scan(&opt.ID, &opt.PollID, &opt.OptionText, &opt.VoteCount, &opt.DisplayOrder); err != nil {
			continue
		}
		if postID, ok := pollIDToPostID[opt.PollID]; ok {
			pollsMap[postID].Options = append(pollsMap[postID].Options, opt)
		}
	}

	return pollsMap, optRows.Err()
}
