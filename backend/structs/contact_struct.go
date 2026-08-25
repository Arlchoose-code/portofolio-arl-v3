package structs

import "time"

type CreateContactRequest struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	Subject        string `json:"subject"`
	Message        string `json:"message"`
	Honeypot       string `json:"honeypot,omitempty"`
	TurnstileToken string `json:"cf_turnstile_token,omitempty"`
}

type UpdateContactStatusRequest struct {
	IsRead *bool   `json:"is_read"`
	Status *string `json:"status"` // unread, read, archived, replied
}

type ContactMessageResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Subject   string    `json:"subject"`
	Message   string    `json:"message"`
	IPAddress string    `json:"ip_address,omitempty"`
	UserAgent string    `json:"user_agent,omitempty"`
	IsRead    bool      `json:"is_read"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
