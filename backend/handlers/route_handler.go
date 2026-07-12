package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"telecom-suite/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RouteHandler struct {
	DB *sql.DB
}

func NewRouteHandler(db *sql.DB) *RouteHandler {
	return &RouteHandler{DB: db}
}

// Create handles POST /api/admin/internal-routes
func (h *RouteHandler) Create(c *gin.Context) {
	var req struct {
		Name             string `json:"name"`
		Slug             string `json:"slug"`
		TelecomGatewayID string `json:"telecom_gateway_id"`
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
	if err := ValidateSlug(req.Slug); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.TelecomGatewayID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "telecom_gateway_id is required"})
		return
	}

	var exists bool
	err := h.DB.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM telecom_gateways WHERE id = $1)",
		req.TelecomGatewayID,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "telecom gateway not found"})
		return
	}

	apiKey := "irk_" + uuid.NewString()

	var route models.InternalRoute
	err = h.DB.QueryRow(
		`INSERT INTO internal_routes (name, slug, telecom_gateway_id, api_key)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, slug, telecom_gateway_id, api_key, created_at`,
		req.Name, req.Slug, req.TelecomGatewayID, apiKey,
	).Scan(&route.ID, &route.Name, &route.Slug, &route.TelecomGatewayID, &route.APIKey, &route.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "an internal route with this slug already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create internal route"})
		return
	}

	var tgName string
	_ = h.DB.QueryRow(
		"SELECT name FROM telecom_gateways WHERE id = $1",
		route.TelecomGatewayID,
	).Scan(&tgName)
	route.TelecomGatewayName = tgName

	table := RouteLogTableName(req.Slug)
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
			"error":         "internal route created but log table creation failed",
			"table_error":   err.Error(),
			"created_route": route,
		})
		return
	}

	c.JSON(http.StatusCreated, route)
}

// List handles GET /api/admin/internal-routes
func (h *RouteHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(
		`SELECT r.id, r.name, r.slug, r.telecom_gateway_id, g.name, r.api_key, r.created_at
		 FROM internal_routes r
		 JOIN telecom_gateways g ON r.telecom_gateway_id = g.id
		 ORDER BY r.created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch internal routes"})
		return
	}
	defer rows.Close()

	var routes []models.InternalRoute
	for rows.Next() {
		var r models.InternalRoute
		if err := rows.Scan(&r.ID, &r.Name, &r.Slug, &r.TelecomGatewayID, &r.TelecomGatewayName, &r.APIKey, &r.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan internal route"})
			return
		}
		routes = append(routes, r)
	}
	if routes == nil {
		routes = []models.InternalRoute{}
	}
	c.JSON(http.StatusOK, routes)
}

// GetLogs handles GET /api/admin/internal-routes/:route_slug/logs
func (h *RouteHandler) GetLogs(c *gin.Context) {
	slug := strings.ToLower(c.Param("route_slug"))
	if err := ValidateSlug(slug); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists bool
	err := h.DB.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM internal_routes WHERE slug = $1)", slug,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "internal route not found"})
		return
	}

	table := RouteLogTableName(slug)
	query := fmt.Sprintf(
		`SELECT id, sender_id, receiver_phone, message_text, status, received_at
		 FROM %s ORDER BY received_at DESC LIMIT 1000`, table,
	)

	rows, err := h.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query route logs"})
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
