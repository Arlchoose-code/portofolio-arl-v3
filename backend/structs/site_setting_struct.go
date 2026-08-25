package structs

type UpdateSiteSettingRequest struct {
	SiteName          string `json:"site_name" binding:"required"`
	TitleSeparator    string `json:"title_separator"`
	Tagline           string `json:"tagline"`
	Description       string `json:"description"`
	LogoURL           string `json:"logo_url"`
	HeroBackgroundURL string `json:"hero_background_url"`
	FaviconURL        string `json:"favicon_url"`
	FooterText        string `json:"footer_text"`
	RobotsTxt         string `json:"robots_txt"`
	OgImageDefaultURL string `json:"og_image_default_url"`
	GoogleAnalyticsID  string `json:"google_analytics_id"`
	AvailableStatus    string `json:"available_status"`
	AvailableBadgeText string `json:"available_badge_text"`
	CustomBadgeText    string `json:"custom_badge_text"`
	TurnstileEnabled   bool   `json:"turnstile_enabled"`
	TurnstileSiteKey   string `json:"turnstile_site_key"`
	TurnstileSecretKey string `json:"turnstile_secret_key"`
	MaintenanceMode    bool   `json:"maintenance_mode"`
}

type UpdateSeoSettingRequest struct {
	Path            string `json:"path" binding:"required"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	OgTitle         string `json:"og_title"`
	OgDescription   string `json:"og_description"`
	OgImageURL      string `json:"og_image_url"`
	Canonical       string `json:"canonical"`
	JsonLD          string `json:"json_ld"`
}

type CreateSocialLinkRequest struct {
	Platform  string `json:"platform" binding:"required"`
	URL       string `json:"url" binding:"required"`
	Icon      string `json:"icon"`
	SortOrder int    `json:"sort_order"`
	IsActive  bool   `json:"is_active"`
}

type UpdateSocialLinkRequest struct {
	Platform  string `json:"platform" binding:"required"`
	URL       string `json:"url" binding:"required"`
	Icon      string `json:"icon"`
	SortOrder int    `json:"sort_order"`
	IsActive  bool   `json:"is_active"`
}
