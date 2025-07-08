package main

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

var db *sql.DB

// Post represents a post in the forum
type Post struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	ImageURL  *string   `json:"image_url"` // Use pointer for nullable field
	Label     string    `json:"label"`
	CreatedAt time.Time `json:"created_at"`
	GoodCount int       `json:"good_count"`
	BadCount  int       `json:"bad_count"`
}

// Reply represents a reply to a post or another reply
type Reply struct {
	ID          int       `json:"id"`
	PostID      int       `json:"post_id"`
	ParentReplyID *int      `json:"parent_reply_id"` // Use pointer for nullable field
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
	GoodCount int       `json:"good_count"`
	BadCount  int       `json:"bad_count"`
}

// Reaction represents a good/bad reaction
type Reaction struct {
	ID          int       `json:"id"`
	PostID      *int      `json:"post_id"`
	ReplyID     *int      `json:"reply_id"`
	ReactionType string    `json:"reaction_type"`
	CreatedAt   time.Time `json:"created_at"`
}

// Forecast represents a mock forecast data
type Forecast struct {
	Date      string `json:"date"`
	Amount    int    `json:"amount"`
	Condition string `json:"condition"`
}

func main() {
	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}

	log.Println("Successfully connected to the database!")

	// Create uploads directory if it doesn't exist
	if _, err := os.Stat("./uploads"); os.IsNotExist(err) {
		err = os.Mkdir("./uploads", 0755)
		if err != nil {
			log.Fatalf("Failed to create uploads directory: %v", err)
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/posts", postsHandler)
	mux.HandleFunc("/api/posts/", postDetailHandler)
	mux.HandleFunc("/api/replies/", replyDetailHandler)
	mux.HandleFunc("/api/forecasts", getForecast)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, Backend!")
	})

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3001"}, // Allow requests from your frontend
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	log.Println("Server starting on port 8080...")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}

func postsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getPosts(w, r)
	case http.MethodPost:
		createPost(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func postDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 || pathSegments[2] == "" {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	postID, err := strconv.Atoi(pathSegments[2])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	if len(pathSegments) == 3 {
		// Handle /api/posts/{id} - not implemented yet
		http.Error(w, "Not Implemented", http.StatusNotImplemented)
		return
	} else if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodGet:
			getRepliesForPost(w, r, postID)
		case http.MethodPost:
			createReplyToPost(w, r, postID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		switch r.Method {
		case http.MethodPost:
			createPostReaction(w, r, postID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	} else {
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}

func replyDetailHandler(w http.ResponseWriter, r *http.Request) {
	pathSegments := splitPath(r.URL.Path)
	if len(pathSegments) < 3 || pathSegments[2] == "" {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	replyID, err := strconv.Atoi(pathSegments[2])
	if err != nil {
		http.Error(w, "Invalid reply ID", http.StatusBadRequest)
		return
	}

	if len(pathSegments) == 4 && pathSegments[3] == "replies" {
		switch r.Method {
		case http.MethodPost:
			createReplyToReply(w, r, replyID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	} else if len(pathSegments) == 4 && pathSegments[3] == "reaction" {
		switch r.Method {
		case http.MethodPost:
			createReplyReaction(w, r, replyID)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	} else {
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}

func createPost(w http.ResponseWriter, r *http.Request) {
	var post Post
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate label
	if post.Label != "現地情報" && post.Label != "その他" {
		http.Error(w, "Invalid label. Must be '現地情報' or 'その他'", http.StatusBadRequest)
		return
	}

	var imageURL *string
	if post.ImageURL != nil && *post.ImageURL != "" {
		// Decode base64 image and save to file
		dataURL := *post.ImageURL
		parts := strings.SplitN(dataURL, ";base64,", 2)
		if len(parts) != 2 {
			http.Error(w, "Invalid image data format", http.StatusBadRequest)
			return
		}
		
		// Extract file extension from data URL
		mimeType := strings.TrimPrefix(parts[0], "data:")
		extension := "jpg" // Default to jpg
		if strings.Contains(mimeType, "png") {
			extension = "png"
		} else if strings.Contains(mimeType, "gif") {
			extension = "gif"
		} else if strings.Contains(mimeType, "jpeg") {
			extension = "jpeg"
		}

		decoded, err := base64.StdEncoding.DecodeString(parts[1])
		if err != nil {
			http.Error(w, "Failed to decode image", http.StatusInternalServerError)
			return
		}

		filename := fmt.Sprintf("%d.%s", time.Now().UnixNano(), extension)
		filePath := filepath.Join("./uploads", filename)
		err = os.WriteFile(filePath, decoded, 0644)
		if err != nil {
			log.Printf("Failed to save image: %v", err)
			http.Error(w, "Failed to save image", http.StatusInternalServerError)
			return
		}
		url := "/uploads/" + filename
		imageURL = &url
	}

	query := `INSERT INTO posts (content, image_url, label) VALUES ($1, $2, $3) RETURNING id, created_at`
	err = db.QueryRow(query, post.Content, imageURL, post.Label).Scan(&post.ID, &post.CreatedAt)
	if err != nil {
		log.Printf("Error inserting post: %v", err)
		http.Error(w, "Could not create post", http.StatusInternalServerError)
		return
	}

	post.ImageURL = imageURL
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func getPosts(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT 
			p.id, p.content, p.image_url, p.label, p.created_at,
			COALESCE(r_good.count, 0) as good_count,
			COALESCE(r_bad.count, 0) as bad_count
		FROM posts p
		LEFT JOIN (
			SELECT post_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY post_id
		) r_good ON p.id = r_good.post_id
		LEFT JOIN (
			SELECT post_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY post_id
		) r_bad ON p.id = r_bad.post_id
	`

	label := r.URL.Query().Get("label")
	if label != "" {
		if label != "現地情報" && label != "その他" {
			http.Error(w, "Invalid label filter. Must be '現地情報' or 'その他'", http.StatusBadRequest)
			return
		}
		query += fmt.Sprintf(" WHERE p.label = '%s'", label)
	}
	query += " ORDER BY p.created_at DESC"

	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Error querying posts: %v", err)
		http.Error(w, "Could not retrieve posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var post Post
		var imageUrl sql.NullString
		err := rows.Scan(&post.ID, &post.Content, &imageUrl, &post.Label, &post.CreatedAt, &post.GoodCount, &post.BadCount)
		if err != nil {
			log.Printf("Error scanning post row: %v", err)
			continue
		}
		if imageUrl.Valid {
			post.ImageURL = &imageUrl.String
		} else {
			post.ImageURL = nil
		}
		posts = append(posts, post)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error after iterating rows: %v", err)
		http.Error(w, "Error retrieving posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func createReplyToPost(w http.ResponseWriter, r *http.Request, postID int) {
	var reply Reply
	err := json.NewDecoder(r.Body).Decode(&reply)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO replies (post_id, content) VALUES ($1, $2) RETURNING id, created_at`
	err = db.QueryRow(query, postID, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		log.Printf("Error inserting reply to post: %v", err)
		http.Error(w, "Could not create reply", http.StatusInternalServerError)
		return
	}

	reply.PostID = postID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func createReplyToReply(w http.ResponseWriter, r *http.Request, parentReplyID int) {
	var reply Reply
	err := json.NewDecoder(r.Body).Decode(&reply)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get post_id from parent reply
	var postID int
	row := db.QueryRow("SELECT post_id FROM replies WHERE id = $1", parentReplyID)
	err = row.Scan(&postID)
	if err != nil {
		log.Printf("Error getting post_id from parent reply: %v", err)
		http.Error(w, "Parent reply not found", http.StatusNotFound)
		return
	}

	query := `INSERT INTO replies (post_id, parent_reply_id, content) VALUES ($1, $2, $3) RETURNING id, created_at`
	err = db.QueryRow(query, postID, parentReplyID, reply.Content).Scan(&reply.ID, &reply.CreatedAt)
	if err != nil {
		log.Printf("Error inserting reply to reply: %v", err)
		http.Error(w, "Could not create reply", http.StatusInternalServerError)
		return
	}

	reply.PostID = postID
	reply.ParentReplyID = &parentReplyID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func getRepliesForPost(w http.ResponseWriter, r *http.Request, postID int) {
	query := `
		SELECT 
			r.id, r.post_id, r.parent_reply_id, r.content, r.created_at,
			COALESCE(r_good.count, 0) as good_count,
			COALESCE(r_bad.count, 0) as bad_count
		FROM replies r
		LEFT JOIN (
			SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'good' GROUP BY reply_id
		) r_good ON r.id = r_good.reply_id
		LEFT JOIN (
			SELECT reply_id, COUNT(*) as count FROM reactions WHERE reaction_type = 'bad' GROUP BY reply_id
		) r_bad ON r.id = r_bad.reply_id
		WHERE r.post_id = $1
		ORDER BY r.created_at ASC
	`
	rows, err := db.Query(query, postID)
	if err != nil {
		log.Printf("Error querying replies: %v", err)
		http.Error(w, "Could not retrieve replies", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	replies := []Reply{}
	for rows.Next() {
		var reply Reply
		var parentReplyID sql.NullInt64
		err := rows.Scan(&reply.ID, &reply.PostID, &parentReplyID, &reply.Content, &reply.CreatedAt, &reply.GoodCount, &reply.BadCount)
		if err != nil {
			log.Printf("Error scanning reply row: %v", err)
			continue
		}
		if parentReplyID.Valid {
			val := int(parentReplyID.Int64)
			reply.ParentReplyID = &val
		} else {
			reply.ParentReplyID = nil
		}
		replies = append(replies, reply)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error after iterating rows: %v", err)
		http.Error(w, "Error retrieving replies", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(replies)
}

func createPostReaction(w http.ResponseWriter, r *http.Request, postID int) {
	var reaction Reaction
	err := json.NewDecoder(r.Body).Decode(&reaction)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if reaction.ReactionType != "good" && reaction.ReactionType != "bad" {
		http.Error(w, "Invalid reaction type. Must be 'good' or 'bad'", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO reactions (post_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err = db.QueryRow(query, postID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		log.Printf("Error inserting post reaction: %v", err)
		http.Error(w, "Could not create reaction", http.StatusInternalServerError)
		return
	}

	val := postID
	reaction.PostID = &val
	reaction.ReplyID = nil
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

func createReplyReaction(w http.ResponseWriter, r *http.Request, replyID int) {
	var reaction Reaction
	err := json.NewDecoder(r.Body).Decode(&reaction)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if reaction.ReactionType != "good" && reaction.ReactionType != "bad" {
		http.Error(w, "Invalid reaction type. Must be 'good' or 'bad'", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO reactions (reply_id, reaction_type) VALUES ($1, $2) RETURNING id, created_at`
	err = db.QueryRow(query, replyID, reaction.ReactionType).Scan(&reaction.ID, &reaction.CreatedAt)
	if err != nil {
		log.Printf("Error inserting reply reaction: %v", err)
		http.Error(w, "Could not create reaction", http.StatusInternalServerError)
		return
	}

	val := replyID
	reaction.ReplyID = &val
	reaction.PostID = nil
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reaction)
}

func getForecast(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Mock forecast data
	forecasts := []Forecast{
		{Date: time.Now().Format("2006-01-02"), Amount: 100, Condition: "晴れ"},
		{Date: time.Now().AddDate(0, 0, 1).Format("2006-01-02"), Amount: 50, Condition: "曇り"},
		{Date: time.Now().AddDate(0, 0, 2).Format("2006-01-02"), Amount: 200, Condition: "雨"},
		{Date: time.Now().AddDate(0, 0, 3).Format("2006-01-02"), Amount: 120, Condition: "晴れ"},
		{Date: time.Now().AddDate(0, 0, 4).Format("2006-01-02"), Amount: 80, Condition: "曇り"},
		{Date: time.Now().AddDate(0, 0, 5).Format("2006-01-02"), Amount: 150, Condition: "雨"},
		{Date: time.Now().AddDate(0, 0, 6).Format("2006-01-02"), Amount: 90, Condition: "晴れ"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(forecasts)
}

// Helper function to split URL path segments
func splitPath(path string) []string {
	var segments []string
	for _, s := range strings.Split(path, "/") {
		if s != "" {
			segments = append(segments, s)
		}
	}
	return segments
}