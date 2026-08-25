package middlewares

import (
	"net/http"
	"strings"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/services"
	"portfolio-arl-backend/structs"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie(cfg.Cookie.AccessTokenName)
		if err != nil || tokenString == "" {
			// Fallback check Authorization header Bearer token
			authHeader := c.GetHeader("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, structs.ErrorResponse("Authentication required"))
			c.Abort()
			return
		}

		claims, err := services.Auth.ValidateAccessToken(tokenString, cfg.JWT.Secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, structs.ErrorResponse("Invalid or expired access token"))
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}
