package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"telecom-suite/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TelecomHandler struct {
	DB *sql.DB
}

func NewTelecomHandler(db *sql.DB) *TelecomHandler {
	return &TelecomHandler{DB: db}
}

// Create handles POST /api/admin/telecom-gateways
func (h *TelecomHandler) Create(c *gin.Context) {
	var req struct {
		Name     string `json:"name"`
		Slug     string `json:"slug"`
		Provider string `json:"provider"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Slug = strings.TrimSpace(strings.ToLower(req.Slug))
	req.Provider = strings.TrimSpace(req.Provider)
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if req.Provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provider is required"})
		return
	}
	if err := ValidateSlug(req.Slug); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey := "tgk_" + uuid.NewString()

	var gw models.TelecomGateway
	err := h.DB.QueryRow(
		`INSERT INTO telecom_gateways (name, slug, provider, api_key)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, slug, provider, api_key, created_at`,
		req.Name, req.Slug, req.Provider, apiKey,
	).Scan(&gw.ID, &gw.Name, &gw.Slug, &gw.Provider, &gw.APIKey, &gw.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "a telecom gateway with this slug already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create telecom gateway"})
		return
	}

	c.JSON(http.StatusCreated, gw)
}

// List handles GET /api/admin/telecom-gateways
func (h *TelecomHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(
		`SELECT id, name, slug, provider, api_key, created_at
		 FROM telecom_gateways ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch telecom gateways"})
		return
	}
	defer rows.Close()

	var gateways []models.TelecomGateway
	for rows.Next() {
		var g models.TelecomGateway
		if err := rows.Scan(&g.ID, &g.Name, &g.Slug, &g.Provider, &g.APIKey, &g.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan telecom gateway"})
			return
		}
		gateways = append(gateways, g)
	}
	if gateways == nil {
		gateways = []models.TelecomGateway{}
	}
	c.JSON(http.StatusOK, gateways)
}
