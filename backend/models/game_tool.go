package models

import (
	"time"

	"gorm.io/gorm"
)

type GameTool struct {
	ID                 uint           `gorm:"primaryKey" json:"id"`
	Name               string         `gorm:"size:100;not null" json:"name"`
	Slug               string         `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	GameCode           string         `gorm:"size:100;not null" json:"game_code"` // Tokopedia Voucher Game Code, e.g. MOBILE_LEGENDS, FREE_FIRE, GENSHIN_IMPACT, VALORANT
	IconURL            string         `gorm:"size:255" json:"icon_url"`
	Description        string         `gorm:"type:text" json:"description"`
	Category           string         `gorm:"size:100;default:'General'" json:"category"`
	UserIdLabel        string         `gorm:"size:100;default:'User ID'" json:"user_id_label"`
	UserIdPlaceholder  string         `gorm:"size:100;default:'Contoh: 103008540'" json:"user_id_placeholder"`
	HasZoneId          bool           `gorm:"default:false" json:"has_zone_id"`
	ZoneIdLabel        string         `gorm:"size:100;default:'Zone ID'" json:"zone_id_label"`
	ZoneIdPlaceholder  string         `gorm:"size:100;default:'Contoh: 2527'" json:"zone_id_placeholder"`
	HasServerList      bool           `gorm:"default:false" json:"has_server_list"`
	ServerOptions      string         `gorm:"type:text" json:"server_options"` // JSON array string e.g. [{"label":"Asia","value":"os_asia"}]
	GuideText          string         `gorm:"type:text" json:"guide_text"`
	IsActive           bool           `gorm:"default:true" json:"is_active"`
	SortOrder          int            `gorm:"default:0" json:"sort_order"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
}
