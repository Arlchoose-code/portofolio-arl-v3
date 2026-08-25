package models

import "time"

type Page struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Title           string    `gorm:"size:255;not null" json:"title"`
	Slug            string    `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Content         string    `gorm:"type:longtext" json:"content"`
	ImageURL        string    `gorm:"size:500" json:"image_url"`
	Status          string    `gorm:"size:50;default:'published'" json:"status"` // published, draft
	MetaTitle       string    `gorm:"size:255" json:"meta_title"`
	MetaDescription string    `gorm:"type:text" json:"meta_description"`
	OgImageURL      string    `gorm:"size:500" json:"og_image_url"`
	SortOrder       int       `gorm:"default:0" json:"sort_order"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
