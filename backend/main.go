package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

// Post represents a post in the forum
type Post struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	ImageURL  *string   `json:"image_url"` // Use pointer for nullable field
	Label     string    `json:"label"`
	CreatedAt time.Time `json:"created_at"`
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

	http.HandleFunc("/api/posts", postsHandler)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, Backend!")
	})

	log.Println("Server starting on port 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
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

	query := `INSERT INTO posts (content, image_url, label) VALUES ($1, $2, $3) RETURNING id, created_at`
	err = db.QueryRow(query, post.Content, post.ImageURL, post.Label).Scan(&post.ID, &post.CreatedAt)
	if err != nil {
		log.Printf("Error inserting post: %v", err)
		http.Error(w, "Could not create post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

func getPosts(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, content, image_url, label, created_at FROM posts ORDER BY created_at DESC")
	if err != nil {
		log.Printf("Error querying posts: %v", err)
		http.Error(w, "Could not retrieve posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var post Post
		// Scan into a temporary variable for image_url to handle NULL values
		var imageUrl sql.NullString
		err := rows.Scan(&post.ID, &post.Content, &imageUrl, &post.Label, &post.CreatedAt)
		if err != nil {
			log.Printf("Error scanning post row: %v", err)
			continue
		}
		// Assign the scanned value to post.ImageURL
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