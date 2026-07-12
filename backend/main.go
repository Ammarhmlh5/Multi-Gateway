package main

import (
	"log"

	"telecom-suite/config"
	"telecom-suite/database"
	"telecom-suite/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	r := gin.Default()
	routes.Register(r, db, cfg.JWTSecret)

	log.Printf("Telecom Suite API listening on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
