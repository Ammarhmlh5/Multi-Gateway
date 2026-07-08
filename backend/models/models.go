package models

import "time"

type Gateway struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	APIKey    string    `json:"api_key"`
	CreatedAt time.Time `json:"created_at"`
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
	TotalGateways int `json:"total_gateways"`
	TotalLogs     int `json:"total_logs"`
}
