package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"telecom-suite/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9_]+$`)

type GatewayHandler struct {
	DB *sql.DB
}

func NewGatewayHandler(db *sql.DB) *GatewayHandler {
	return &GatewayHandler{DB: db}
}

// logTableName converts a slug into the strict dynamic table name
// convention: gw_table_<slug>_logs. The slug is validated to be a safe SQL
// identifier (lowercase alphanumeric + underscore only) before use.
func logTableName(slug string) string {
	return fmt.Sprintf("gw_table_%s_logs", slug)
}

// validateSlug ensures the slug is safe to interpolate into dynamic SQL.
func validateSlug(slug string) error {
	if slug == "" {
		return fmt.Errorf("slug is required")
	}
	if len(slug) > 80 {
		return fmt.Errorf("slug must be 80 characters or fewer")
	}
	if !slugPattern.MatchString(slug) {
		return fmt.Errorf("slug must contain only lowercase letters, numbers, and underscores")
	}
	return nil
}

// CreateGateway inserts a new gateway record and dynamically creates its
// dedicated log table via raw SQL.
// POST /api/admin/gateways
func (h *GatewayHandler) CreateGateway(c *gin.Context) {
	var req struct {
		Name string `json:"name"`
		Slug string `json:"slug"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Slug = strings.TrimSpace(strings.ToLower(req.Slug))
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if err := validateSlug(req.Slug); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey := "gwk_" + uuid.NewString()

	var gateway models.Gateway
	err := h.DB.QueryRow(
		`INSERT INTO gateways (name, slug, api_key)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, slug, api_key, created_at`,
		req.Name, req.Slug, apiKey,
	).Scan(&gateway.ID, &gateway.Name, &gateway.Slug, &gateway.APIKey, &gateway.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "a gateway with this slug already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create gateway"})
		return
	}

	table := logTableName(req.Slug)
	createSQL := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
			sender_id varchar(255) NOT NULL,
			receiver_phone varchar(50) NOT NULL,
			message_text text NOT NULL,
			status varchar(50) NOT NULL DEFAULT 'received',
			received_at timestamptz NOT NULL DEFAULT now()
		);
		ALTER TABLE %s ENABLE ROW LEVEL SECURITY;`, table, table)

	if _, err := h.DB.Exec(createSQL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":          "gateway record created but log table creation failed",
			"table_error":    err.Error(),
			"created_gateway": gateway,
		})
		return
	}

	c.JSON(http.StatusCreated, gateway)
}

// ListGateways returns all gateway records.
// GET /api/admin/gateways
func (h *GatewayHandler) ListGateways(c *gin.Context) {
	rows, err := h.DB.Query(
		"SELECT id, name, slug, api_key, created_at FROM gateways ORDER BY created_at DESC",
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch gateways"})
		return
	}
	defer rows.Close()

	var gateways []models.Gateway
	for rows.Next() {
		var g models.Gateway
		if err := rows.Scan(&g.ID, &g.Name, &g.Slug, &g.APIKey, &g.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan gateway"})
			return
		}
		gateways = append(gateways, g)
	}
	if gateways == nil {
		gateways = []models.Gateway{}
	}
	c.JSON(http.StatusOK, gateways)
}

// GetGatewayLogs queries the specific gateway's dynamic log table and returns
// the real records.
// GET /api/admin/gateways/:gateway_slug/logs
func (h *GatewayHandler) GetGatewayLogs(c *gin.Context) {
	slug := strings.ToLower(c.Param("gateway_slug"))
	if err := validateSlug(slug); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists bool
	err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM gateways WHERE slug = $1)", slug).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "gateway not found"})
		return
	}

	table := logTableName(slug)
	query := fmt.Sprintf(
		`SELECT id, sender_id, receiver_phone, message_text, status, received_at
		 FROM %s ORDER BY received_at DESC LIMIT 1000`, table,
	)

	rows, err := h.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query gateway logs"})
		return
	}
	defer rows.Close()

	var logs []models.SMSLog
	for rows.Next() {
		var l models.SMSLog
		if err := rows.Scan(&l.ID, &l.SenderID, &l.ReceiverPhone, &l.MessageText, &l.Status, &l.ReceivedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan log row"})
			return
		}
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []models.SMSLog{}
	}
	c.JSON(http.StatusOK, logs)
}
