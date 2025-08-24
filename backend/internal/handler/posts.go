//backend/internal/handler/posts.go
package handler

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/model"
	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/storage"
	"github.com/cenkalti/backoff/v4"
	"github.com/golang-jwt/jwt/v5"
	"github.com/lib/pq"
)

func (h *Handler) postsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.getPosts(w, r)
	case http.MethodPost:
		isAdmin := false
		cookie, err := r.Cookie("admin_token")
		if err == nil {
			tokenString := cookie.Value
			claims := &model.Claims{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) { return h.jwtKey, nil })
			if err == nil && token.Valid && claims.Role == "admin" {
				isAdmin = true
			}
		}
		h.createPost(w, r, isAdmin)
	default:
		http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) postDetailHandler(w http.ResponseWriter, r *http.Request) {
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
		h.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
			h.deleteItem(w, r, "posts", postID)
		}).ServeHTTP(w, r)
		return
	}
	if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodGet:
			h.getRepliesForPost(w, r, postID)
		case http.MethodPost:
			h.createReplyToPost(w, r, postID)
		default:
			http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
		}
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		h.createPostReaction(w, r, postID)
	} else {
		http.Error(w, "見つかりません", http.StatusNotFound)
	}
}

func (h *Handler) replyDetailHandler(w http.ResponseWriter, r *http.Request) {
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
		h.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
			h.deleteItem(w, r, "replies", replyID)
		}).ServeHTTP(w, r)
		return
	}
	if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		h.createReplyToReply(w, r, replyID)
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		h.createReplyReaction(w, r, replyID)
	} else {
		http.Error(w, "見つかりません", http.StatusNotFound)
	}
}

func (h *Handler) createPost(w http.ResponseWriter, r *http.Request, isAdmin bool) {
	var post model.Post
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

			if err := storage.UploadFileToSupabase(h.logger, "post-images", filename, decoded, mimeType); err != nil {
				h.logger.Error("画像のアップロードに失敗しました", "error", err)
				http.Error(w, "画像のアップロードに失敗しました", http.StatusInternalServerError)
				return
			}
			publicURL := fmt.Sprintf("%s/storage/v1/object/public/post-images/%s", os.Getenv("SUPABASE_URL"), filename)
			imageURLs = append(imageURLs, publicURL)
		}
	}

	query := `INSERT INTO posts (username, content, image_urls, label) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	if err := h.db.QueryRow(query, post.Username, post.Content, pq.Array(imageURLs), post.Label).Scan(&post.ID, &post.CreatedAt); err != nil {
		h.logger.Error("投稿の挿入エラー", "error", err)
		http.Error(w, "投稿の作成に失敗しました", http.StatusInternalServerError)
		return
	}

	post.ImageURLs = imageURLs
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func (h *Handler) getPosts(w http.ResponseWriter, r *http.Request) {
	var posts []model.Post

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

		rows, err := h.db.Query(query, args...)
		if err != nil {
			h.logger.Error("投稿のクエリエラー（リトライ中）", "error", err)
			return err
		}
		defer rows.Close()

		posts = []model.Post{}
		for rows.Next() {
			var post model.Post
			if err := rows.Scan(&post.ID, &post.Username, &post.Content, pq.Array(&post.ImageURLs), &post.Label, &post.CreatedAt, &post.GoodCount, &post.BadCount); err != nil {
				h.logger.Error("投稿行のスキャンエラー", "error", err)
				continue
			}
			posts = append(posts, post)
		}
		return rows.Err()
	}

	err := backoff.Retry(operation, backoff.WithMaxRetries(backoff.NewExponentialBackOff(), 3))

	if err != nil {
		h.logger.Error("投稿の取得に失敗しました（リトライ上限到達）", "error", err)
		http.Error(w, "投稿の取得に失敗しました", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func (h *Handler) getRepliesForPost(w http.ResponseWriter, r *http.Request, postID int) {
	var replies []model.Reply

	operation := func() error {
		query := `SELECT r.id, r.post_id, r.parent_reply_id, r.username, r.content, r.created_at, COALESCE(r_good.count, 0) as good_count, COALESCE(r_bad.count, 0) as bad_count, COALESCE(pr.username, p.username) as parent_username FROM replies r LEFT JOIN posts p ON r.post_id = p.id LEFT JOIN replies pr ON r.parent_reply_id = pr.id LEFT JOIN (SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY reply_id) r_good ON r.id = r_good.reply_id LEFT JOIN (SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY reply_id) r_bad ON r.id = r_bad.reply_id WHERE r.post_id = $1 ORDER BY r.created_at ASC`

		rows, err := h.db.Query(query, postID)
		if err != nil {
			h.logger.Error("返信のクエリエラー（リトライ中）", "error", err)
			return err
		}
		defer rows.Close()

		replies = []model.Reply{}
		for rows.Next() {
			var reply model.Reply
			var parentReplyID sql.NullInt64
			var parentUsername sql.NullString
			if err := rows.Scan(&reply.ID, &reply.PostID, &parentReplyID, &reply.Username, &reply.Content, &reply.CreatedAt, &reply.GoodCount, &reply.BadCount, &parentUsername); err != nil {
				h.logger.Error("返信行のスキャンエラー", "error", err)
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
		return rows.Err()
	}

	err := backoff.Retry(operation, backoff.WithMaxRetries(backoff.NewExponentialBackOff(), 3))

	if err != nil {
		h.logger.Error("返信の取得に失敗しました（リトライ上限到達）", "error", err)
		http.Error(w, "返信の取得に失敗しました", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(replies)
}

func (h *Handler) createReplyToPost(w http.ResponseWriter, r *http.Request, postID int) {
	var reply model.Reply
	json.NewDecoder(r.Body).Decode(&reply)
	query := `INSERT INTO replies (post_id, username, content) VALUES ($1, $2, $3) RETURNING id, created_at`
	err := h.db.QueryRow(query, postID, reply.Username, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		h.logger.Error("投稿への返信エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusInternalServerError)
		return
	}
	reply.PostID = postID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func (h *Handler) createReplyToReply(w http.ResponseWriter, r *http.Request, parentReplyID int) {
	var reply model.Reply
	json.NewDecoder(r.Body).Decode(&reply)
	var postID int
	err := h.db.QueryRow("SELECT post_id FROM replies WHERE id = $1", parentReplyID).Scan(&postID)
	if err != nil {
		h.logger.Error("親返信の取得エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusNotFound)
		return
	}
	query := `INSERT INTO replies (post_id, parent_reply_id, username, content) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err = h.db.QueryRow(query, postID, parentReplyID, reply.Username, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		h.logger.Error("返信への返信エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusInternalServerError)
		return
	}
	reply.PostID = postID
	reply.ParentReplyID = &parentReplyID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func (h *Handler) createPostReaction(w http.ResponseWriter, r *http.Request, postID int) {
	var reaction model.Reaction
	json.NewDecoder(r.Body).Decode(&reaction)
	query := `INSERT INTO reactions (post_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err := h.db.QueryRow(query, postID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		h.logger.Error("投稿へのリアクションエラー", "error", err)
		http.Error(w, "リアクションできませんでした", http.StatusInternalServerError)
		return
	}
	reaction.PostID = &postID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

func (h *Handler) createReplyReaction(w http.ResponseWriter, r *http.Request, replyID int) {
	var reaction model.Reaction
	json.NewDecoder(r.Body).Decode(&reaction)
	query := `INSERT INTO reactions (reply_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err := h.db.QueryRow(query, replyID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		h.logger.Error("返信へのリアクションエラー", "error", err)
		http.Error(w, "リアクションできませんでした", http.StatusInternalServerError)
		return
	}
	reaction.ReplyID = &replyID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

func (h *Handler) deleteItem(w http.ResponseWriter, r *http.Request, itemType string, itemID int) {
	var tableName, imageColumn string
	if itemType == "posts" {
		tableName, imageColumn = "posts", "image_urls"
	} else if itemType == "replies" {
		tableName = "replies"
	} else {
		http.Error(w, "不正なアイテムタイプです", http.StatusBadRequest)
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		h.logger.Error("トランザクション開始エラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	if imageColumn != "" {
		var imageURLs pq.StringArray
		query := fmt.Sprintf("SELECT %s FROM %s WHERE id = $1", imageColumn, tableName)
		if err := tx.QueryRow(query, itemID).Scan(&imageURLs); err != nil && err != sql.ErrNoRows {
			h.logger.Error("画像URLのクエリエラー", "error", err)
			http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
			return
		}
		if len(imageURLs) > 0 {
			fileNames := make([]string, len(imageURLs))
			for i, url := range imageURLs {
				fileNames[i] = filepath.Base(url)
			}
			if err := storage.DeleteFileFromSupabase(h.logger, "post-images", fileNames); err != nil {
				h.logger.Warn("Supabaseからの画像ファイル削除に失敗しました", "filenames", fileNames, "error", err)
			}
		}
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE id = $1", tableName)
	if _, err := tx.Exec(query, itemID); err != nil {
		h.logger.Error("DBからのアイテム削除エラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		h.logger.Error("トランザクションのコミットエラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}