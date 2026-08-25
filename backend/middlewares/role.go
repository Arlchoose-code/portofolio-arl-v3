package middlewares

import (
	"net/http"

	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

func RequireAdminRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, structs.ErrorResponse("Unauthorized: Login required"))
			c.Abort()
			return
		}
		c.Next()
	}
}
