package models

import "time"

type Media struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Filename     string    `gorm:"size:255;not null" json:"filename"`
	OriginalName string    `gorm:"size:255;not null" json:"original_name"`
	ThumbnailURL string    `gorm:"size:500" json:"thumbnail_url"`
	MediumURL    string    `gorm:"size:500" json:"medium_url"`
	OriginalURL  string    `gorm:"size:500" json:"original_url"`
	MimeType     string    `gorm:"size:100;not null" json:"mime_type"`
	SizeBytes    int64     `gorm:"not null" json:"size_bytes"`
	Width        int       `gorm:"default:0" json:"width"`
	Height       int       `gorm:"default:0" json:"height"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
