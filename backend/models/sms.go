package models

import "time"

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
