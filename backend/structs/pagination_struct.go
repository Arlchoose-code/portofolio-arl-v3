package structs

type PaginationParams struct {
	Page    int    `form:"page" json:"page"`
	PerPage int    `form:"per_page" json:"per_page"`
	Search  string `form:"search" json:"search"`
	Sort    string `form:"sort" json:"sort"`
	Order   string `form:"order" json:"order"`
}
