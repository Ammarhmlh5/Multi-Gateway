package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set in .env")
	}

	fmt.Println("Connecting to database...")

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening connection: %v\n", err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatalf("Failed to ping database: %v\n", err)
	}
	fmt.Println("Database connection verified successfully!")

	migrationPath := filepath.Join("..", "supabase", "migrations", "20260708130335_create_gateways_and_admin_users_tables.sql")
	query, err := ioutil.ReadFile(migrationPath)
	if err != nil {
		log.Fatalf("Failed to read migration file at %s: %v", migrationPath, err)
	}

	fmt.Println("Running SQL migrations...")
	_, err = db.Exec(string(query))
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	fmt.Println("Migration completed successfully! Created tables 'gateways' and 'admin_users'.")
}
