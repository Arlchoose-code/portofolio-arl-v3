package structs

type CreatePageRequest struct {
	Title           string `json:"title" binding:"required"`
	Slug            string `json:"slug"`
	Content         string `json:"content"`
	ImageURL        string `json:"image_url"`
	Status          string `json:"status"` // published, draft
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	OgImageURL      string `json:"og_image_url"`
	SortOrder       int    `json:"sort_order"`
}

type UpdatePageRequest struct {
	Title           string `json:"title" binding:"required"`
	Slug            string `json:"slug"`
	Content         string `json:"content"`
	ImageURL        string `json:"image_url"`
	Status          string `json:"status"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	OgImageURL      string `json:"og_image_url"`
	SortOrder       int    `json:"sort_order"`
}
