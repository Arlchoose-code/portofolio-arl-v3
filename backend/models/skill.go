package models

import "time"

type SkillCategory struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Skills    []Skill   `gorm:"foreignKey:CategoryID" json:"skills,omitempty"`
}

type Skill struct {
	ID         uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name       string         `gorm:"size:100;not null" json:"name"`
	CategoryID uint           `gorm:"index;not null" json:"category_id"`
	Category   *SkillCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	IconURL    string         `gorm:"size:500" json:"icon_url"`
	Level      string         `gorm:"size:50;default:'intermediate'" json:"level"` // beginner, intermediate, advanced, expert
	SortOrder  int            `gorm:"default:0" json:"sort_order"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}
