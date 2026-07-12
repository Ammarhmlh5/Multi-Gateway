package models

import "time"

// InternalRoute — Level 2: internal path linked to a telecom gateway.
type InternalRoute struct {
	ID                 string    `json:"id"`
	Name               string    `json:"name"`
	Slug               string    `json:"slug"`
	TelecomGatewayID   string    `json:"telecom_gateway_id"`
	TelecomGatewayName string    `json:"telecom_gateway_name"`
	APIKey             string    `json:"api_key"`
	CreatedAt          time.Time `json:"created_at"`
}
