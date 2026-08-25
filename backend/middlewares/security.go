package middlewares

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeadersMiddleware injects standard OWASP security headers into all responses
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent MIME type sniffing
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")

		// Prevent Clickjacking attacks
		c.Writer.Header().Set("X-Frame-Options", "SAMEORIGIN")

		// Enable cross-site scripting filter
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")

		// Control referrer information sent in HTTP requests
		c.Writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Restrict access to sensitive browser features
		c.Writer.Header().Set("Permissions-Policy", "geolocation=(), camera=(), microphone=()")

		c.Next()
	}
}
