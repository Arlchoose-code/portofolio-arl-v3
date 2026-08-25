package models

import "time"

type SiteSetting struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	SiteName          string    `gorm:"size:255;not null" json:"site_name"`
	TitleSeparator    string    `gorm:"size:10;default:'|'" json:"title_separator"`
	Tagline           string    `gorm:"size:255" json:"tagline"`
	Description       string    `gorm:"type:text" json:"description"`
	LogoURL           string    `gorm:"size:500" json:"logo_url"`
	HeroBackgroundURL string    `gorm:"size:500" json:"hero_background_url"`
	FaviconURL        string    `gorm:"size:500" json:"favicon_url"`
	FooterText        string    `gorm:"size:500" json:"footer_text"`
	RobotsTxt         string    `gorm:"type:text" json:"robots_txt"`
	OgImageDefaultURL string    `gorm:"size:500" json:"og_image_default_url"`
	GoogleAnalyticsID  string    `gorm:"size:100" json:"google_analytics_id"`
	AvailableStatus    string    `gorm:"size:100;default:'Available for Work'" json:"available_status"`
	AvailableBadgeText string    `gorm:"size:255;default:'Open for Engineering & AI Roles'" json:"available_badge_text"`
	CustomBadgeText    string    `gorm:"size:255;default:'Full Stack • Applied AI'" json:"custom_badge_text"`
	ContactEmail       string    `gorm:"size:255;default:'contact@arlab.my.id'" json:"contact_email"`
	ContactLocation    string    `gorm:"size:255;default:'Jakarta, Indonesia'" json:"contact_location"`
	TurnstileEnabled   bool      `gorm:"default:false" json:"turnstile_enabled"`
	TurnstileSiteKey   string    `gorm:"size:255" json:"turnstile_site_key"`
	TurnstileSecretKey string    `gorm:"size:255" json:"-"`
	MaintenanceMode    bool      `gorm:"default:false" json:"maintenance_mode"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
