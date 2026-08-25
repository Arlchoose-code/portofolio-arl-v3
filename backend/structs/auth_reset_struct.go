package structs

type ForgotPasswordRequest struct {
	Email          string `json:"email" binding:"required,email"`
	TurnstileToken string `json:"cf_turnstile_token,omitempty"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=6,max=100"`
}
