package structs

type CreateEducationRequest struct {
	Institution  string  `json:"institution" binding:"required"`
	Degree       string  `json:"degree"`
	Major        string  `json:"major"`
	StartYear    string  `json:"start_year" binding:"required"`
	EndYear      *string `json:"end_year"`
	IsCurrent    bool    `json:"is_current"`
	GPA          *string `json:"gpa"`
	Description  string  `json:"description"`
	ThumbnailURL string  `json:"thumbnail_url"`
	MediumURL    string  `json:"medium_url"`
	OriginalURL  string  `json:"original_url"`
	Type         string  `json:"type"` // education, organization
	SortOrder    int     `json:"sort_order"`
}

type UpdateEducationRequest struct {
	Institution  string  `json:"institution" binding:"required"`
	Degree       string  `json:"degree"`
	Major        string  `json:"major"`
	StartYear    string  `json:"start_year" binding:"required"`
	EndYear      *string `json:"end_year"`
	IsCurrent    bool    `json:"is_current"`
	GPA          *string `json:"gpa"`
	Description  string  `json:"description"`
	ThumbnailURL string  `json:"thumbnail_url"`
	MediumURL    string  `json:"medium_url"`
	OriginalURL  string  `json:"original_url"`
	Type         string  `json:"type"`
	SortOrder    int     `json:"sort_order"`
}
