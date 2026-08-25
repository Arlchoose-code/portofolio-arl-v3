package models

import (
	"time"

	"gorm.io/gorm"
)

type ToolSetting struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	ToolType    string         `gorm:"size:100;index" json:"tool_type"` // e.g. "qris-manipulator", "game-checker", "youtube-downloader", "2fa-generator", "base64", "password-generator"
	Slug        string         `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Icon        string         `gorm:"size:100" json:"icon"`
	Category    string         `gorm:"size:100;default:'Developer Tools'" json:"category"`
	IsEnabled   bool           `gorm:"default:true" json:"is_enabled"`
	IsPopular   bool           `gorm:"default:false" json:"is_popular"`
	Badge       string         `gorm:"size:100" json:"badge"`
	BadgeColor  string         `gorm:"size:100" json:"badge_color"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
