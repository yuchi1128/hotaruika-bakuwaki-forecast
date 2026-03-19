// backend/internal/model/model.go
package model

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Postは投稿
type Post struct {
	ID          int                `json:"id"`
	Username    string             `json:"username"`
	Content     string             `json:"content"`
	ImageURLs   []string           `json:"image_urls"`
	Label       string             `json:"label"`
	DeviceID    *string            `json:"device_id,omitempty"`
	CreatedAt   time.Time          `json:"created_at"`
	GoodCount   int                `json:"good_count"`
	BadCount    int                `json:"bad_count"`
	Poll        *Poll              `json:"poll,omitempty"`
	PollRequest *CreatePollRequest `json:"poll_request,omitempty"`
}

// Pollはアンケート
type Poll struct {
	ID         int          `json:"id"`
	PostID     int          `json:"post_id"`
	ExpiresAt  time.Time    `json:"expires_at"`
	TotalVotes int          `json:"total_votes"`
	CreatedAt  time.Time    `json:"created_at"`
	Options    []PollOption `json:"options"`
}

// PollOptionはアンケートの選択肢
type PollOption struct {
	ID           int    `json:"id"`
	PollID       int    `json:"poll_id"`
	OptionText   string `json:"option_text"`
	VoteCount    int    `json:"vote_count"`
	DisplayOrder int    `json:"display_order"`
}

// CreatePollRequestはアンケート作成リクエスト
type CreatePollRequest struct {
	Options      []string `json:"options"`
	DurationHours int     `json:"duration_hours"`
}

// Replyは投稿や他の返信への返信
type Reply struct {
	ID             int       `json:"id"`
	PostID         int       `json:"post_id"`
	ParentReplyID  *int      `json:"parent_reply_id"`
	Username       string    `json:"username"`
	Content        string    `json:"content"`
	ImageURLs      []string  `json:"image_urls"`
	Label          *string   `json:"label,omitempty"`
	DeviceID       *string   `json:"device_id,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	GoodCount      int       `json:"good_count"`
	BadCount       int       `json:"bad_count"`
	ParentUsername *string   `json:"parent_username,omitempty"`
}

// Reactionはgood/badのリアクション
type Reaction struct {
	ID           int       `json:"id"`
	PostID       *int      `json:"post_id"`
	ReplyID      *int      `json:"reply_id"`
	ReactionType string    `json:"reaction_type"`
	CreatedAt    time.Time `json:"created_at"`
}

// ClaimsはJWTのペイロード
type Claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// LoginRequestはログインリクエストのボディ
type LoginRequest struct {
	Password string `json:"password"`
}

// BannedDeviceはBANされたデバイス
type BannedDevice struct {
	ID       int       `json:"id"`
	DeviceID string    `json:"device_id"`
	Reason   *string   `json:"reason,omitempty"`
	BannedAt time.Time `json:"banned_at"`
}

// PostWithRepliesは返信を含む投稿
type PostWithReplies struct {
	Post
	Replies []Reply `json:"replies"`
}

// PaginatedPostsResponseはページネーション付き投稿レスポンス
type PaginatedPostsResponse struct {
	Posts      []PostWithReplies `json:"posts"`
	Total      int               `json:"total"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalPages int               `json:"totalPages"`
}
