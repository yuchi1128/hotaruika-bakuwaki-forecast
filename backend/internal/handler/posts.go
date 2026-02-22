// backend/internal/handler/posts.go
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

	"github.com/cenkalti/backoff/v4"
	"github.com/golang-jwt/jwt/v5"
	"github.com/lib/pq"
	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/model"
	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/storage"
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
	if r.Method == http.MethodPatch && len(pathSegments) == 4 && pathSegments[3] == "label" {
		h.authMiddleware(func(w http.ResponseWriter, r *http.Request) {
			h.updatePostLabel(w, r, postID)
		}).ServeHTTP(w, r)
		return
	}
	if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodGet:
			h.getRepliesForPost(w, r, postID)
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
			h.createReplyToPost(w, r, postID, isAdmin)
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
		h.createReplyToReply(w, r, replyID, isAdmin)
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

	// ユーザー名と本文の検証
	if strings.TrimSpace(post.Username) == "" {
		http.Error(w, "ユーザー名を入力してください", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(post.Content) == "" {
		http.Error(w, "本文を入力してください", http.StatusBadRequest)
		return
	}
	// テキスト長の上限チェック（名前30文字）
	if len([]rune(post.Username)) > 30 {
		http.Error(w, "ユーザー名が長すぎます（30文字以内）", http.StatusBadRequest)
		return
	}

	if isAdmin {
		// 管理者は本文1000文字まで
		if len([]rune(post.Content)) > 1000 {
			http.Error(w, "本文が長すぎます（1000文字以内）", http.StatusBadRequest)
			return
		}
	} else {
		// 一般ユーザーは本文150文字まで
		if len([]rune(post.Content)) > 150 {
			http.Error(w, "本文が長すぎます（150文字以内）", http.StatusBadRequest)
			return
		}
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

	imageURLs, err := h.uploadBase64Images(post.ImageURLs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
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
	var total int
	label := r.URL.Query().Get("label")
	includeReplies := r.URL.Query().Get("include") == "replies"
	search := r.URL.Query().Get("search")
	sort := r.URL.Query().Get("sort")

	// ページネーションパラメータ
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	page := 0
	limit := 0
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	usePagination := page > 0 && limit > 0
	offset := 0
	if usePagination {
		offset = (page - 1) * limit
	}

	// ソート順の決定
	orderBy := "p.created_at DESC"
	switch sort {
	case "oldest":
		orderBy = "p.created_at ASC"
	case "good":
		orderBy = "good_count DESC, p.created_at DESC"
	case "bad":
		orderBy = "bad_count DESC, p.created_at DESC"
	}

	operation := func() error {
		// WHERE句の構築
		var conditions []string
		var countArgs []interface{}
		argIndex := 1

		if label != "" {
			conditions = append(conditions, fmt.Sprintf("p.label = $%d", argIndex))
			countArgs = append(countArgs, label)
			argIndex++
		}
		if search != "" {
			conditions = append(conditions, fmt.Sprintf("(p.username ILIKE $%d OR p.content ILIKE $%d)", argIndex, argIndex))
			countArgs = append(countArgs, "%"+search+"%")
			argIndex++
		}

		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " WHERE " + strings.Join(conditions, " AND ")
		}

		// 総件数を取得（ページネーション時のみ）
		if usePagination {
			countQuery := "SELECT COUNT(*) FROM posts p" + whereClause
			if err := h.db.QueryRow(countQuery, countArgs...).Scan(&total); err != nil {
				h.logger.Error("投稿数のカウントエラー", "error", err)
				return err
			}
		}

		baseQuery := `SELECT p.id, p.username, p.content, p.image_urls, p.label, p.created_at, COALESCE(r_good.count, 0) as good_count, COALESCE(r_bad.count, 0) as bad_count FROM posts p LEFT JOIN (SELECT post_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY post_id) r_good ON p.id = r_good.post_id LEFT JOIN (SELECT post_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY post_id) r_bad ON p.id = r_bad.post_id`

		args := make([]interface{}, len(countArgs))
		copy(args, countArgs)

		query := baseQuery + whereClause + " ORDER BY " + orderBy

		if usePagination {
			query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
			args = append(args, limit, offset)
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

	// include=replies の場合
	if includeReplies {
		var postsWithReplies []model.PostWithReplies

		if len(posts) > 0 {
			postIDs := make([]int, len(posts))
			for i, p := range posts {
				postIDs[i] = p.ID
			}

			repliesMap, err := h.getAllRepliesForPosts(postIDs)
			if err != nil {
				h.logger.Error("返信の一括取得に失敗しました", "error", err)
				http.Error(w, "返信の取得に失敗しました", http.StatusInternalServerError)
				return
			}

			postsWithReplies = make([]model.PostWithReplies, len(posts))
			for i, post := range posts {
				postsWithReplies[i] = model.PostWithReplies{
					Post:    post,
					Replies: repliesMap[post.ID],
				}
				if postsWithReplies[i].Replies == nil {
					postsWithReplies[i].Replies = []model.Reply{}
				}
			}
		} else {
			postsWithReplies = []model.PostWithReplies{}
		}

		// ページネーションレスポンス
		if usePagination {
			totalPages := 0
			if total > 0 {
				totalPages = (total + limit - 1) / limit
			}
			response := model.PaginatedPostsResponse{
				Posts:      postsWithReplies,
				Total:      total,
				Page:       page,
				Limit:      limit,
				TotalPages: totalPages,
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(postsWithReplies)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

// getAllRepliesForPosts は複数の投稿IDに対する返信を一括取得する
func (h *Handler) getAllRepliesForPosts(postIDs []int) (map[int][]model.Reply, error) {
	repliesMap := make(map[int][]model.Reply)

	if len(postIDs) == 0 {
		return repliesMap, nil
	}

	query := `SELECT r.id, r.post_id, r.parent_reply_id, r.username, r.content, r.image_urls, r.label, r.created_at,
		COALESCE(r_good.count, 0) as good_count, COALESCE(r_bad.count, 0) as bad_count,
		COALESCE(pr.username, p.username) as parent_username
		FROM replies r
		LEFT JOIN posts p ON r.post_id = p.id
		LEFT JOIN replies pr ON r.parent_reply_id = pr.id
		LEFT JOIN (SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY reply_id) r_good ON r.id = r_good.reply_id
		LEFT JOIN (SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY reply_id) r_bad ON r.id = r_bad.reply_id
		WHERE r.post_id = ANY($1)
		ORDER BY r.created_at ASC`

	rows, err := h.db.Query(query, pq.Array(postIDs))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var reply model.Reply
		var parentReplyID sql.NullInt64
		var parentUsername sql.NullString
		var label sql.NullString
		if err := rows.Scan(&reply.ID, &reply.PostID, &parentReplyID, &reply.Username, &reply.Content, pq.Array(&reply.ImageURLs), &label, &reply.CreatedAt, &reply.GoodCount, &reply.BadCount, &parentUsername); err != nil {
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
		if label.Valid {
			reply.Label = &label.String
		}
		repliesMap[reply.PostID] = append(repliesMap[reply.PostID], reply)
	}

	return repliesMap, rows.Err()
}

func (h *Handler) getRepliesForPost(w http.ResponseWriter, _ *http.Request, postID int) {
	var replies []model.Reply

	operation := func() error {
		query := `SELECT r.id, r.post_id, r.parent_reply_id, r.username, r.content, r.image_urls, r.label, r.created_at, COALESCE(r_good.count, 0) as good_count, COALESCE(r_bad.count, 0) as bad_count, COALESCE(pr.username, p.username) as parent_username FROM replies r LEFT JOIN posts p ON r.post_id = p.id LEFT JOIN replies pr ON r.parent_reply_id = pr.id LEFT JOIN (SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY reply_id) r_good ON r.id = r_good.reply_id LEFT JOIN (SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY reply_id) r_bad ON r.id = r_bad.reply_id WHERE r.post_id = $1 ORDER BY r.created_at ASC`

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
			var label sql.NullString
			if err := rows.Scan(&reply.ID, &reply.PostID, &parentReplyID, &reply.Username, &reply.Content, pq.Array(&reply.ImageURLs), &label, &reply.CreatedAt, &reply.GoodCount, &reply.BadCount, &parentUsername); err != nil {
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
			if label.Valid {
				reply.Label = &label.String
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

func (h *Handler) createReplyToPost(w http.ResponseWriter, r *http.Request, postID int, isAdmin bool) {
	var reply model.Reply
	if err := json.NewDecoder(r.Body).Decode(&reply); err != nil {
		http.Error(w, "不正なリクエストです", http.StatusBadRequest)
		return
	}

	// ユーザー名と本文の検証
	if strings.TrimSpace(reply.Username) == "" {
		http.Error(w, "ユーザー名を入力してください", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(reply.Content) == "" {
		http.Error(w, "本文を入力してください", http.StatusBadRequest)
		return
	}
	// テキスト長の上限チェック（名前30文字、本文150文字）
	if len([]rune(reply.Username)) > 30 {
		http.Error(w, "ユーザー名が長すぎます（30文字以内）", http.StatusBadRequest)
		return
	}
	if len([]rune(reply.Content)) > 150 {
		http.Error(w, "本文が長すぎます（150文字以内）", http.StatusBadRequest)
		return
	}

	// 管理者のみ「管理者」ラベルを使用可能
	if reply.Label != nil && *reply.Label == "管理者" && !isAdmin {
		http.Error(w, "管理者ラベルは使用できません", http.StatusForbidden)
		return
	}

	imageURLs, err := h.uploadBase64Images(reply.ImageURLs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	query := `INSERT INTO replies (post_id, username, content, label, image_urls) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err = h.db.QueryRow(query, postID, reply.Username, reply.Content, reply.Label, pq.Array(imageURLs)).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		h.logger.Error("投稿への返信エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusInternalServerError)
		return
	}
	reply.PostID = postID
	reply.ImageURLs = imageURLs
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func (h *Handler) createReplyToReply(w http.ResponseWriter, r *http.Request, parentReplyID int, isAdmin bool) {
	var reply model.Reply
	if err := json.NewDecoder(r.Body).Decode(&reply); err != nil {
		http.Error(w, "不正なリクエストです", http.StatusBadRequest)
		return
	}

	// ユーザー名と本文の検証
	if strings.TrimSpace(reply.Username) == "" {
		http.Error(w, "ユーザー名を入力してください", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(reply.Content) == "" {
		http.Error(w, "本文を入力してください", http.StatusBadRequest)
		return
	}
	// テキスト長の上限チェック（名前30文字、本文150文字）
	if len([]rune(reply.Username)) > 30 {
		http.Error(w, "ユーザー名が長すぎます（30文字以内）", http.StatusBadRequest)
		return
	}
	if len([]rune(reply.Content)) > 150 {
		http.Error(w, "本文が長すぎます（150文字以内）", http.StatusBadRequest)
		return
	}

	// 管理者のみ「管理者」ラベルを使用可能
	if reply.Label != nil && *reply.Label == "管理者" && !isAdmin {
		http.Error(w, "管理者ラベルは使用できません", http.StatusForbidden)
		return
	}

	// 親返信の存在確認を画像アップロードより先に行う
	var postID int
	err := h.db.QueryRow("SELECT post_id FROM replies WHERE id = $1", parentReplyID).Scan(&postID)
	if err != nil {
		h.logger.Error("親返信の取得エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusNotFound)
		return
	}

	imageURLs, imgErr := h.uploadBase64Images(reply.ImageURLs)
	if imgErr != nil {
		http.Error(w, imgErr.Error(), http.StatusInternalServerError)
		return
	}

	query := `INSERT INTO replies (post_id, parent_reply_id, username, content, label, image_urls) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`
	err = h.db.QueryRow(query, postID, parentReplyID, reply.Username, reply.Content, reply.Label, pq.Array(imageURLs)).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		h.logger.Error("返信への返信エラー", "error", err)
		http.Error(w, "返信できませんでした", http.StatusInternalServerError)
		return
	}
	reply.PostID = postID
	reply.ParentReplyID = &parentReplyID
	reply.ImageURLs = imageURLs
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

// uploadBase64Images はBase64エンコードされた画像データをSupabase Storageにアップロードし、公開URLの配列を返す
func (h *Handler) uploadBase64Images(dataURLs []string) ([]string, error) {
	var imageURLs []string
	for _, dataURL := range dataURLs {
		parts := strings.SplitN(dataURL, ";base64,", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("画像データが不正です")
		}
		mimeType := strings.TrimPrefix(parts[0], "data:")
		extension := "jpeg"
		if strings.Contains(mimeType, "png") {
			extension = "png"
		}
		decoded, err := base64.StdEncoding.DecodeString(parts[1])
		if err != nil {
			return nil, fmt.Errorf("画像のデコードに失敗しました")
		}
		filename := fmt.Sprintf("%d.%s", time.Now().UnixNano(), extension)
		if err := storage.UploadFileToSupabase(h.logger, "post-images", filename, decoded, mimeType); err != nil {
			h.logger.Error("画像のアップロードに失敗しました", "error", err)
			return nil, fmt.Errorf("画像のアップロードに失敗しました")
		}
		publicURL := fmt.Sprintf("%s/storage/v1/object/public/post-images/%s", os.Getenv("SUPABASE_URL"), filename)
		imageURLs = append(imageURLs, publicURL)
	}
	return imageURLs, nil
}

func (h *Handler) deleteItem(w http.ResponseWriter, _ *http.Request, itemType string, itemID int) {
	var tableName, imageColumn string
	if itemType == "posts" {
		tableName, imageColumn = "posts", "image_urls"
	} else if itemType == "replies" {
		tableName, imageColumn = "replies", "image_urls"
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

	// 対象アイテム自体の画像URLを収集
	var allFileNames []string
	if imageColumn != "" {
		var imageURLs pq.StringArray
		query := fmt.Sprintf("SELECT %s FROM %s WHERE id = $1", imageColumn, tableName)
		if err := tx.QueryRow(query, itemID).Scan(&imageURLs); err != nil && err != sql.ErrNoRows {
			h.logger.Error("画像URLのクエリエラー", "error", err)
			http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
			return
		}
		for _, url := range imageURLs {
			allFileNames = append(allFileNames, filepath.Base(url))
		}
	}

	// カスケード削除される子返信の画像URLも収集
	if itemType == "posts" {
		rows, err := tx.Query("SELECT image_urls FROM replies WHERE post_id = $1 AND image_urls IS NOT NULL", itemID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var urls pq.StringArray
				if err := rows.Scan(&urls); err == nil {
					for _, url := range urls {
						allFileNames = append(allFileNames, filepath.Base(url))
					}
				}
			}
		}
	}

	// Supabase Storageから画像を削除
	if len(allFileNames) > 0 {
		if err := storage.DeleteFileFromSupabase(h.logger, "post-images", allFileNames); err != nil {
			h.logger.Warn("Supabaseからの画像ファイル削除に失敗しました", "filenames", allFileNames, "error", err)
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

func (h *Handler) updatePostLabel(w http.ResponseWriter, r *http.Request, postID int) {
	var req struct {
		Label string `json:"label"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "不正なリクエストです", http.StatusBadRequest)
		return
	}

	// ラベルのバリデーション
	if req.Label != "現地情報" && req.Label != "その他" && req.Label != "管理者" {
		http.Error(w, "不正なラベルです", http.StatusBadRequest)
		return
	}

	query := `UPDATE posts SET label = $1 WHERE id = $2`
	result, err := h.db.Exec(query, req.Label, postID)
	if err != nil {
		h.logger.Error("ラベルの更新エラー", "error", err)
		http.Error(w, "ラベルの更新に失敗しました", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		h.logger.Error("RowsAffectedの取得エラー", "error", err)
		http.Error(w, "内部サーバーエラー", http.StatusInternalServerError)
		return
	}
	if rowsAffected == 0 {
		http.Error(w, "投稿が見つかりません", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"label": req.Label})
}
