package routes

import (
	"portfolio-arl-backend/config"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, cfg *config.Config) {
	apiGroup := r.Group("/api")
	{
		publicGroup := apiGroup.Group("/public")
		RegisterPublicRoutes(publicGroup)

		adminGroup := apiGroup.Group("/admin")
		RegisterAdminRoutes(adminGroup, cfg)
	}
}
