package models

import "time"

type RevalidationJob struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Paths        string    `gorm:"type:text;not null" json:"paths"` // JSON array string e.g. ["/", "/projects"]
	Status       string    `gorm:"size:50;default:'pending'" json:"status"` // pending, processing, done, failed
	Attempts     int       `gorm:"default:0" json:"attempts"`
	MaxAttempts  int       `gorm:"default:3" json:"max_attempts"`
	ErrorMessage string    `gorm:"type:text" json:"error_message"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
