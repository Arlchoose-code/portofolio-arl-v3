package structs

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email,max=150"`
	Password string `json:"password" binding:"required,min=6,max=100"`
	Role     string `json:"role"` // 'admin' or 'staff'
}

type UpdateUserRequest struct {
	Name     string  `json:"name" binding:"required,min=2,max=100"`
	Email    string  `json:"email" binding:"required,email,max=150"`
	Role     string  `json:"role"`
	Password *string `json:"password,omitempty"`
}
