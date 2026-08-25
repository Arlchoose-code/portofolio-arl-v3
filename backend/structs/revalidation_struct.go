package structs

type RevalidateRequest struct {
	Paths []string `json:"paths" binding:"required"`
}

type RevalidateResponse struct {
	Revalidated []string `json:"revalidated"`
	Message     string   `json:"message"`
}
