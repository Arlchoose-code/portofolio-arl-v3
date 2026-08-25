package models

import "time"

type ContactMessage struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Email     string    `gorm:"size:150;not null;index" json:"email"`
	Subject   string    `gorm:"size:200" json:"subject"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	IPAddress string    `gorm:"size:50" json:"ip_address"`
	UserAgent string    `gorm:"size:255" json:"user_agent"`
	IsRead    bool      `gorm:"default:false;index" json:"is_read"`
	Status    string    `gorm:"size:50;default:'unread'" json:"status"` // unread, read, archived, replied
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
