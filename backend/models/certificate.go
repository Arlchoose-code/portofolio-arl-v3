package models

import "time"

type Certificate struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name          string    `gorm:"size:255;not null" json:"name"`
	Issuer        string    `gorm:"size:255;not null" json:"issuer"`
	IssueDate     string    `gorm:"size:100" json:"issue_date"`
	CredentialID  string    `gorm:"size:255" json:"credential_id"`
	CredentialURL string    `gorm:"size:500" json:"credential_url"`
	ThumbnailURL  string    `gorm:"size:500" json:"thumbnail_url"`
	MediumURL     string    `gorm:"size:500" json:"medium_url"`
	OriginalURL   string    `gorm:"size:500" json:"original_url"`
	Description   string    `gorm:"type:text" json:"description"`
	SortOrder     int       `gorm:"default:0" json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
