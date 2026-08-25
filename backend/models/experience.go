package models

import "time"

type Experience struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Company     string    `gorm:"size:255;not null" json:"company"`
	Position    string    `gorm:"size:255;not null" json:"position"`
	Type        string    `gorm:"size:50;not null" json:"type"` // full-time, freelance, contract, internship, self-employed, part-time
	Location    string    `gorm:"size:255" json:"location"`
	WorkMode    string    `gorm:"size:50;default:'remote'" json:"work_mode"` // remote, on-site, hybrid
	StartDate   string    `gorm:"size:100;not null" json:"start_date"`
	EndDate     *string   `gorm:"size:100" json:"end_date"`
	IsCurrent   bool      `gorm:"default:false" json:"is_current"`
	TechStack   string    `gorm:"type:text" json:"tech_stack"`
	Description string    `gorm:"type:longtext" json:"description"`
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
