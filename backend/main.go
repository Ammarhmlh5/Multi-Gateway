package main

import (
	"log"

	"telecom-suite/config"
	"telecom-suite/database"
	"telecom-suite/handlers"
	"telecom-suite/middleware"

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

	// CORS: allow the Bolt frontend (and any local dev origin) to call the API.
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-KEY")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret)
	gatewayHandler := handlers.NewGatewayHandler(db)
	smsHandler := handlers.NewSMSHandler(db)
	statsHandler := handlers.NewStatsHandler(db)

	api := r.Group("/api")
	{
		api.POST("/admin/login", authHandler.Login)

		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(cfg.JWTSecret))
		{
			admin.POST("/gateways", gatewayHandler.CreateGateway)
			admin.GET("/gateways", gatewayHandler.ListGateways)
			admin.GET("/gateways/:gateway_slug/logs", gatewayHandler.GetGatewayLogs)
			admin.GET("/stats", statsHandler.Stats)
		}

		api.POST("/v1/gateway/:gateway_slug/sms/send", smsHandler.SendSMS)
	}

	log.Printf("Telecom Suite API listening on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
