package models

import "time"

type ChatSession struct {
	ID               uint          `gorm:"primaryKey;autoIncrement" json:"id"`
	SessionKey       string        `gorm:"size:255;uniqueIndex;not null" json:"session_key"`
	IPAddress        string        `gorm:"size:45" json:"ip_address"`
	UserAgent        string        `gorm:"size:500" json:"user_agent"`
	MessagesThisHour int           `gorm:"default:0" json:"messages_this_hour"`
	HourWindowStart  time.Time     `json:"hour_window_start"`
	CreatedAt        time.Time     `json:"created_at"`
	LastActivityAt   time.Time     `json:"last_activity_at"`
	Messages         []ChatMessage `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE" json:"messages,omitempty"`
}

type ChatMessage struct {
	ID            uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	SessionID     uint        `gorm:"index;not null" json:"session_id"`
	Role          string      `gorm:"size:50;not null" json:"role"` // user, assistant, system
	Content       string      `gorm:"type:longtext;not null" json:"content"`
	IsRejected    bool        `gorm:"default:false" json:"is_rejected"`
	ThinkingSteps string      `gorm:"type:text" json:"thinking_steps"` // JSON array
	CreatedAt     time.Time   `json:"created_at"`
	Session       ChatSession `gorm:"foreignKey:SessionID" json:"-"`
}
