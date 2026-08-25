package structs

type Response struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

type ResponseWithMeta struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    any    `json:"data"`
	Meta    Meta   `json:"meta"`
}

type ResponseError struct {
	Status  bool              `json:"status"`
	Message string            `json:"message"`
	Errors  map[string]string `json:"errors,omitempty"`
	Data    any               `json:"data"`
}

type Meta struct {
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

func SuccessResponse(message string, data any) Response {
	return Response{
		Status:  true,
		Message: message,
		Data:    data,
	}
}

func SuccessWithMeta(message string, data any, meta Meta) ResponseWithMeta {
	return ResponseWithMeta{
		Status:  true,
		Message: message,
		Data:    data,
		Meta:    meta,
	}
}

func ErrorResponse(message string) Response {
	return Response{
		Status:  false,
		Message: message,
		Data:    nil,
	}
}

func ValidationErrorResponse(message string, errors map[string]string) ResponseError {
	return ResponseError{
		Status:  false,
		Message: message,
		Errors:  errors,
		Data:    nil,
	}
}
