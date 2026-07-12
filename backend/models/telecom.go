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
