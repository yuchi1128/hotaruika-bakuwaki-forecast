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

	http.HandleFunc("/api/posts", createPost)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, Backend!")
	})

	log.Println("Server starting on port 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func createPost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

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
