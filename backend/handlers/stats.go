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

// Stats returns the total number of gateways and the total number of SMS logs
// across every gateway's dynamic log table.
// GET /api/admin/stats
func (h *StatsHandler) Stats(c *gin.Context) {
	var totalGateways int
	if err := h.DB.QueryRow("SELECT COUNT(*) FROM gateways").Scan(&totalGateways); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count gateways"})
		return
	}

	rows, err := h.DB.Query("SELECT slug FROM gateways")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list gateway slugs"})
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
		table := logTableName(slug)
		var count int
		// Dynamic table may have been created after the gateway row; if the
		// table is missing, treat its count as 0.
		err := h.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM %s", table)).Scan(&count)
		if err != nil {
			continue
		}
		totalLogs += count
	}

	c.JSON(http.StatusOK, models.StatsResponse{
		TotalGateways: totalGateways,
		TotalLogs:     totalLogs,
	})
}
