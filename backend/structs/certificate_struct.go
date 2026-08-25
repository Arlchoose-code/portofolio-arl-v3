package structs

type CreateCertificateRequest struct {
	Name          string `json:"name" binding:"required"`
	Issuer        string `json:"issuer" binding:"required"`
	IssueDate     string `json:"issue_date" binding:"required"`
	CredentialID  string `json:"credential_id"`
	CredentialURL string `json:"credential_url"`
	ThumbnailURL  string `json:"thumbnail_url"`
	MediumURL     string `json:"medium_url"`
	OriginalURL   string `json:"original_url"`
	Description   string `json:"description"`
	SortOrder     int    `json:"sort_order"`
}

type UpdateCertificateRequest struct {
	Name          string `json:"name" binding:"required"`
	Issuer        string `json:"issuer" binding:"required"`
	IssueDate     string `json:"issue_date" binding:"required"`
	CredentialID  string `json:"credential_id"`
	CredentialURL string `json:"credential_url"`
	ThumbnailURL  string `json:"thumbnail_url"`
	MediumURL     string `json:"medium_url"`
	OriginalURL   string `json:"original_url"`
	Description   string `json:"description"`
	SortOrder     int    `json:"sort_order"`
}
