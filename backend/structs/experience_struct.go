package structs

type CreateExperienceRequest struct {
	Company     string   `json:"company" binding:"required"`
	Position    string   `json:"position" binding:"required"`
	Type        string   `json:"type" binding:"required"` // full-time, freelance, contract, internship, self-employed, part-time
	Location    string   `json:"location"`
	WorkMode    string   `json:"work_mode"` // remote, on-site, hybrid
	StartDate   string   `json:"start_date" binding:"required"`
	EndDate     *string  `json:"end_date"`
	IsCurrent   bool     `json:"is_current"`
	TechStack   []string `json:"tech_stack"`
	Description string   `json:"description"`
	SortOrder   int      `json:"sort_order"`
}

type UpdateExperienceRequest struct {
	Company     string   `json:"company" binding:"required"`
	Position    string   `json:"position" binding:"required"`
	Type        string   `json:"type" binding:"required"`
	Location    string   `json:"location"`
	WorkMode    string   `json:"work_mode"`
	StartDate   string   `json:"start_date" binding:"required"`
	EndDate     *string  `json:"end_date"`
	IsCurrent   bool     `json:"is_current"`
	TechStack   []string `json:"tech_stack"`
	Description string   `json:"description"`
	SortOrder   int      `json:"sort_order"`
}
