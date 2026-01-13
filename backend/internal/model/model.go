//backend/internal/model/model.go
package model

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Postは投稿
type Post struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	ImageURLs []string  `json:"image_urls"`
	Label     string    `json:"label"`
	CreatedAt time.Time `json:"created_at"`
	GoodCount int       `json:"good_count"`
	BadCount  int       `json:"bad_count"`
}

// Replyは投稿や他の返信への返信
type Reply struct {
	ID             int       `json:"id"`
	PostID         int       `json:"post_id"`
	ParentReplyID  *int      `json:"parent_reply_id"`
	Username       string    `json:"username"`
	Content        string    `json:"content"`
	Label          *string   `json:"label,omitempty"`
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