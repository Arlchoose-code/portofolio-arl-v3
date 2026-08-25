package structs

type CreateProjectCategoryRequest struct {
	Name      string `json:"name" binding:"required"`
	Slug      string `json:"slug"`
	SortOrder int    `json:"sort_order"`
}

type UpdateProjectCategoryRequest struct {
	Name      string `json:"name" binding:"required"`
	Slug      string `json:"slug"`
	SortOrder int    `json:"sort_order"`
}

type CreateProjectRequest struct {
	Title            string   `json:"title" binding:"required"`
	Slug             string   `json:"slug"`
	ShortDescription string   `json:"short_description"`
	Description      string   `json:"description"`
	CategoryID       *uint    `json:"category_id"`
	TechStack        []string `json:"tech_stack"`
	RepoURL          string   `json:"repo_url"`
	DemoURL          string   `json:"demo_url"`
	IsFeatured       bool     `json:"is_featured"`
	Status           string   `json:"status"`
	SortOrder        int      `json:"sort_order"`
}

type UpdateProjectRequest struct {
	Title            string   `json:"title" binding:"required"`
	Slug             string   `json:"slug"`
	ShortDescription string   `json:"short_description"`
	Description      string   `json:"description"`
	CategoryID       *uint    `json:"category_id"`
	TechStack        []string `json:"tech_stack"`
	RepoURL          string   `json:"repo_url"`
	DemoURL          string   `json:"demo_url"`
	IsFeatured       bool     `json:"is_featured"`
	Status           string   `json:"status"`
	SortOrder        int      `json:"sort_order"`
}

type ProjectImageRequest struct {
	ThumbnailURL string `json:"thumbnail_url" binding:"required"`
	MediumURL    string `json:"medium_url" binding:"required"`
	OriginalURL  string `json:"original_url" binding:"required"`
	Caption      string `json:"caption"`
	SortOrder    int    `json:"sort_order"`
}

type ReorderProjectImagesRequest struct {
	ImageIDs []uint `json:"image_ids" binding:"required"`
}
