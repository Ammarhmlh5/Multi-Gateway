package models

import "time"

// TelecomGateway — Level 1: direct connection to a telecom company.
type TelecomGateway struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Provider  string    `json:"provider"`
	APIKey    string    `json:"api_key"`
	CreatedAt time.Time `json:"created_at"`
}

// InternalRoute — Level 2: internal path linked to a telecom gateway.
type InternalRoute struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Slug             string    `json:"slug"`
	TelecomGatewayID string    `json:"telecom_gateway_id"`
	TelecomGatewayName string   `json:"telecom_gateway_name"`
	APIKey           string    `json:"api_key"`
	CreatedAt        time.Time `json:"created_at"`
}

type SMSRequest struct {
	Sender string `json:"sender"`
	To     string `json:"to"`
	Text   string `json:"text"`
}

type SMSLog struct {
	ID            string    `json:"id"`
	SenderID      string    `json:"sender_id"`
	ReceiverPhone string    `json:"receiver_phone"`
	MessageText   string    `json:"message_text"`
	Status        string    `json:"status"`
	ReceivedAt    time.Time `json:"received_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type StatsResponse struct {
	TotalTelecomGateways int `json:"total_telecom_gateways"`
	TotalInternalRoutes int `json:"total_internal_routes"`
	TotalLogs            int `json:"total_logs"`
}
