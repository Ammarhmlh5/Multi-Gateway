package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"telecom-suite/models"

	"github.com/gin-gonic/gin"
)

type SMSHandler struct {
	DB *sql.DB
}

func NewSMSHandler(db *sql.DB) *SMSHandler {
	return &SMSHandler{DB: db}
}

// SendSMS validates the internal route slug + X-API-KEY header and inserts
// the incoming SMS into that route's dedicated dynamic log table.
// POST /api/v1/route/:route_slug/sms/send
func (h *SMSHandler) SendSMS(c *gin.Context) {
	slug := strings.ToLower(c.Param("route_slug"))
	if err := validateSlug(slug); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey := c.GetHeader("X-API-KEY")
	if apiKey == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing X-API-KEY header"})
		return
	}

	var storedKey string
	err := h.DB.QueryRow(
		"SELECT api_key FROM internal_routes WHERE slug = $1",
		slug,
	).Scan(&storedKey)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "internal route not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if storedKey != apiKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid API key"})
		return
	}

	var req models.SMSRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if req.Sender == "" || req.To == "" || req.Text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sender, to, and text are all required"})
		return
	}

	table := routeLogTableName(slug)
	insertSQL := fmt.Sprintf(
		`INSERT INTO %s (sender_id, receiver_phone, message_text, status)
		 VALUES ($1, $2, $3, 'received')
		 RETURNING id, received_at`, table,
	)

	var id, receivedAt string
	if err := h.DB.QueryRow(insertSQL, req.Sender, req.To, req.Text).Scan(&id, &receivedAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to insert log"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "SMS accepted",
		"id":          id,
		"received_at": receivedAt,
		"route":       slug,
		"status":      "received",
	})
}
