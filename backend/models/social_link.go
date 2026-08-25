package models

import "time"

type SocialLink struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Platform  string    `gorm:"size:100;not null" json:"platform"`
	URL       string    `gorm:"size:500;not null" json:"url"`
	Icon      string    `gorm:"size:100" json:"icon"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
