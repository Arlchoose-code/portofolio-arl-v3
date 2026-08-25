package models

import "time"

type EmailSetting struct {
	ID                 uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ActiveProvider     string    `gorm:"size:50;default:'hybrid'" json:"active_provider"` // 'brevo', 'resend', 'hybrid'
	BrevoAPIKey        string    `gorm:"size:255" json:"brevo_api_key"`
	ResendAPIKey       string    `gorm:"size:255" json:"resend_api_key"`
	DefaultSenderEmail string    `gorm:"size:150;default:'contact@arlab.my.id'" json:"default_sender_email"`
	DefaultSenderName  string    `gorm:"size:100;default:'Syahril Haryono'" json:"default_sender_name"`
	InboundDomain      string    `gorm:"size:150" json:"inbound_domain"`
	IsConfigured       bool      `gorm:"default:false" json:"is_configured"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type EmailThread struct {
	ID            uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Subject       string         `gorm:"size:255;not null;index" json:"subject"`
	Snippet       string         `gorm:"size:500" json:"snippet"`
	LastMessageAt time.Time      `gorm:"index" json:"last_message_at"`
	MessageCount  int            `gorm:"default:1" json:"message_count"`
	HasUnread     bool           `gorm:"default:true;index" json:"has_unread"`
	IsStarred     bool           `gorm:"default:false;index" json:"is_starred"`
	IsArchived    bool           `gorm:"default:false;index" json:"is_archived"`
	IsTrash       bool           `gorm:"default:false;index" json:"is_trash"`
	Messages      []EmailMessage `gorm:"foreignKey:ThreadID" json:"messages,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

type EmailMessage struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ThreadID    uint      `gorm:"index;not null" json:"thread_id"`
	Direction   string    `gorm:"size:20;not null;index" json:"direction"` // 'inbound' or 'outbound'
	FromEmail   string    `gorm:"size:150;not null" json:"from_email"`
	FromName    string    `gorm:"size:100" json:"from_name"`
	ToEmail     string    `gorm:"size:150;not null" json:"to_email"`
	ToName      string    `gorm:"size:100" json:"to_name"`
	Cc          string    `gorm:"size:500" json:"cc,omitempty"`
	Bcc         string    `gorm:"size:500" json:"bcc,omitempty"`
	Subject     string    `gorm:"size:255;not null" json:"subject"`
	BodyHtml    string    `gorm:"type:longtext" json:"body_html"`
	BodyText    string    `gorm:"type:longtext" json:"body_text"`
	MessageID   string    `gorm:"size:255;index" json:"message_id,omitempty"`
	InReplyTo   string    `gorm:"size:255;index" json:"in_reply_to,omitempty"`
	Status      string    `gorm:"size:50;default:'inbox';index" json:"status"` // 'inbox', 'sent', 'draft', 'trash'
	IsRead      bool      `gorm:"default:false;index" json:"is_read"`
	IsStarred   bool      `gorm:"default:false;index" json:"is_starred"`
	IsTrash     bool      `gorm:"default:false;index" json:"is_trash"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PasswordResetToken struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Email     string    `gorm:"size:255;index;not null" json:"email"`
	Token     string    `gorm:"size:255;uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `gorm:"index;not null" json:"expires_at"`
	Used      bool      `gorm:"default:false;index" json:"used"`
	CreatedAt time.Time `json:"created_at"`
}
