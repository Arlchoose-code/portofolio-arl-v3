package models

import "time"

type SeoSetting struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Path            string    `gorm:"size:255;uniqueIndex;not null" json:"path"`
	MetaTitle       string    `gorm:"size:255" json:"meta_title"`
	MetaDescription string    `gorm:"type:text" json:"meta_description"`
	OgTitle         string    `gorm:"size:255" json:"og_title"`
	OgDescription   string    `gorm:"type:text" json:"og_description"`
	OgImageURL      string    `gorm:"size:500" json:"og_image_url"`
	Canonical       string    `gorm:"size:500" json:"canonical"`
	JsonLD          string    `gorm:"type:longtext" json:"json_ld"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
