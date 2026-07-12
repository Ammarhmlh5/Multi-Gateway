package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"telecom-suite/models"

	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	DB *sql.DB
}

func NewStatsHandler(db *sql.DB) *StatsHandler {
	return &StatsHandler{DB: db}
}

// Stats returns the total number of telecom gateways, internal routes, and
// total SMS logs across every internal route's dynamic log table.
// GET /api/admin/stats
func (h *StatsHandler) Stats(c *gin.Context) {
	var totalTG int
	if err := h.DB.QueryRow("SELECT COUNT(*) FROM telecom_gateways").Scan(&totalTG); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count telecom gateways"})
		return
	}

	var totalIR int
	if err := h.DB.QueryRow("SELECT COUNT(*) FROM internal_routes").Scan(&totalIR); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count internal routes"})
		return
	}

	rows, err := h.DB.Query("SELECT slug FROM internal_routes")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list route slugs"})
		return
	}
	defer rows.Close()

	var slugs []string
	for rows.Next() {
		var s string
		if err := rows.Scan(&s); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan slug"})
			return
		}
		slugs = append(slugs, strings.ToLower(s))
	}

	totalLogs := 0
	for _, slug := range slugs {
		table := routeLogTableName(slug)
		var count int
		err := h.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM %s", table)).Scan(&count)
		if err != nil {
			continue
		}
		totalLogs += count
	}

	c.JSON(http.StatusOK, models.StatsResponse{
		TotalTelecomGateways: totalTG,
		TotalInternalRoutes: totalIR,
		TotalLogs:            totalLogs,
	})
}
