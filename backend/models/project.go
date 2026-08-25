package models

import "time"

type ProjectCategory struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Slug      string    `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Projects  []Project `gorm:"foreignKey:CategoryID" json:"projects,omitempty"`
}

type Project struct {
	ID               uint             `gorm:"primaryKey;autoIncrement" json:"id"`
	Title            string           `gorm:"size:255;not null" json:"title"`
	Slug             string           `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	ShortDescription string           `gorm:"type:text" json:"short_description"`
	Description      string           `gorm:"type:longtext" json:"description"`
	CategoryID       *uint            `gorm:"index" json:"category_id"`
	Category         *ProjectCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	TechStack        string           `gorm:"type:text" json:"tech_stack"` // JSON array or comma-separated
	RepoURL          string           `gorm:"size:500" json:"repo_url"`
	DemoURL          string           `gorm:"size:500" json:"demo_url"`
	IsFeatured       bool             `gorm:"default:false" json:"is_featured"`
	Status           string           `gorm:"size:50;default:'published'" json:"status"` // published, draft, archived
	SortOrder        int              `gorm:"default:0" json:"sort_order"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
	Images           []ProjectImage   `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"images,omitempty"`
}

type ProjectImage struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProjectID    uint      `gorm:"index;not null" json:"project_id"`
	ThumbnailURL string    `gorm:"size:500" json:"thumbnail_url"`
	MediumURL    string    `gorm:"size:500" json:"medium_url"`
	OriginalURL  string    `gorm:"size:500" json:"original_url"`
	Caption      string    `gorm:"size:255" json:"caption"`
	SortOrder    int       `gorm:"default:0" json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
