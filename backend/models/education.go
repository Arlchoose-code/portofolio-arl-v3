package models

import "time"

type Education struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Institution  string    `gorm:"size:255;not null" json:"institution"`
	Degree       string    `gorm:"size:255" json:"degree"`
	Major        string    `gorm:"size:255" json:"major"`
	StartYear    string    `gorm:"size:50;not null" json:"start_year"`
	EndYear      *string   `gorm:"size:50" json:"end_year"`
	IsCurrent    bool      `gorm:"default:false" json:"is_current"`
	GPA          *string   `gorm:"size:50" json:"gpa"`
	Description  string    `gorm:"type:text" json:"description"`
	ThumbnailURL string    `gorm:"size:500" json:"thumbnail_url"`
	MediumURL    string    `gorm:"size:500" json:"medium_url"`
	OriginalURL  string    `gorm:"size:500" json:"original_url"`
	Type         string    `gorm:"size:50;default:'education'" json:"type"` // education, organization
	SortOrder    int       `gorm:"default:0" json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
