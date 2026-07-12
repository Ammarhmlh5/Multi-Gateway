package routes

import (
	"database/sql"

	"telecom-suite/handlers"
	"telecom-suite/middleware"

	"github.com/gin-gonic/gin"
)

// Register wires every API route onto the given engine.
func Register(r *gin.Engine, db *sql.DB, jwtSecret string) {
	r.Use(corsMiddleware())

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	auth := handlers.NewAuthHandler(db, jwtSecret)
	telecom := handlers.NewTelecomHandler(db)
	route := handlers.NewRouteHandler(db)
	sms := handlers.NewSMSHandler(db)
	stats := handlers.NewStatsHandler(db)

	api := r.Group("/api")
	{
		api.POST("/admin/login", auth.Login)

		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(jwtSecret))
		{
			// Level 1: Telecom Gateways
			admin.POST("/telecom-gateways", telecom.Create)
			admin.GET("/telecom-gateways", telecom.List)

			// Level 2: Internal Routes
			admin.POST("/internal-routes", route.Create)
			admin.GET("/internal-routes", route.List)
			admin.GET("/internal-routes/:route_slug/logs", route.GetLogs)

			// Stats
			admin.GET("/stats", stats.Stats)
		}

		// SMS ingestion into an internal route
		api.POST("/v1/route/:route_slug/sms/send", sms.SendSMS)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-KEY")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
