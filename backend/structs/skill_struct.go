package structs

type CreateSkillCategoryRequest struct {
	Name      string `json:"name" binding:"required"`
	SortOrder int    `json:"sort_order"`
}

type UpdateSkillCategoryRequest struct {
	Name      string `json:"name" binding:"required"`
	SortOrder int    `json:"sort_order"`
}

type CreateSkillRequest struct {
	Name       string `json:"name" binding:"required"`
	CategoryID uint   `json:"category_id" binding:"required"`
	IconURL    string `json:"icon_url"`
	Level      string `json:"level"` // beginner, intermediate, advanced, expert
	SortOrder  int    `json:"sort_order"`
}

type UpdateSkillRequest struct {
	Name       string `json:"name" binding:"required"`
	CategoryID uint   `json:"category_id" binding:"required"`
	IconURL    string `json:"icon_url"`
	Level      string `json:"level"`
	SortOrder  int    `json:"sort_order"`
}
