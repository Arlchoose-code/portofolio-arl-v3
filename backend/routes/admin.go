package routes

import (
	"portfolio-arl-backend/config"
	"portfolio-arl-backend/controllers/admin"
	"portfolio-arl-backend/middlewares"
	"github.com/gin-gonic/gin"
)

func RegisterAdminRoutes(r *gin.RouterGroup, cfg *config.Config) {
	authCtrl := admin.NewAuthController(cfg)
	projectCtrl := admin.NewProjectController()
	certCtrl := admin.NewCertificateController()
	expCtrl := admin.NewExperienceController()
	eduCtrl := admin.NewEducationController()
	skillCtrl := admin.NewSkillController()
	mediaCtrl := admin.NewMediaController(cfg)
	pageCtrl := admin.NewPageController()
	siteCtrl := admin.NewSiteSettingController()
	seoCtrl := admin.NewSeoSettingController()
	socialCtrl := admin.NewSocialLinkController()
	aiCtrl := admin.NewAISettingController()
	chatCtrl := admin.NewChatSessionController()
	contactCtrl := admin.NewContactController()
	userCtrl := admin.NewUserController()
	mailboxCtrl := admin.NewMailboxController()
	gameToolCtrl := admin.NewGameToolController()

	// Public admin auth endpoints
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", authCtrl.Login)
		authGroup.POST("/refresh", authCtrl.RefreshToken)
		authGroup.POST("/forgot-password", authCtrl.ForgotPassword)
		authGroup.POST("/reset-password", authCtrl.ResetPassword)
	}

	// Protected admin endpoints
	adminProtected := r.Group("")
	adminProtected.Use(middlewares.AuthMiddleware(cfg), middlewares.RequireAdminRole())
	{
		// Auth profile & logout
		adminProtected.POST("/auth/logout", authCtrl.Logout)
		adminProtected.GET("/auth/me", authCtrl.Me)

		// Projects
		adminProtected.GET("/projects", projectCtrl.ListProjects)
		adminProtected.POST("/projects", projectCtrl.CreateProject)
		adminProtected.GET("/projects/:id", projectCtrl.GetProject)
		adminProtected.PUT("/projects/:id", projectCtrl.UpdateProject)
		adminProtected.DELETE("/projects/:id", projectCtrl.DeleteProject)

		// Project Categories
		adminProtected.GET("/project-categories", projectCtrl.ListCategories)
		adminProtected.POST("/project-categories", projectCtrl.CreateCategory)
		adminProtected.PUT("/project-categories/:id", projectCtrl.UpdateCategory)
		adminProtected.DELETE("/project-categories/:id", projectCtrl.DeleteCategory)

		// Project Images
		adminProtected.POST("/projects/:id/images", projectCtrl.AddProjectImage)
		adminProtected.DELETE("/projects/images/:imageId", projectCtrl.DeleteProjectImage)

		// Certificates
		adminProtected.GET("/certificates", certCtrl.ListCertificates)
		adminProtected.POST("/certificates", certCtrl.CreateCertificate)
		adminProtected.GET("/certificates/:id", certCtrl.GetCertificate)
		adminProtected.PUT("/certificates/:id", certCtrl.UpdateCertificate)
		adminProtected.DELETE("/certificates/:id", certCtrl.DeleteCertificate)

		// Experiences
		adminProtected.GET("/experiences", expCtrl.ListExperiences)
		adminProtected.POST("/experiences", expCtrl.CreateExperience)
		adminProtected.GET("/experiences/:id", expCtrl.GetExperience)
		adminProtected.PUT("/experiences/:id", expCtrl.UpdateExperience)
		adminProtected.DELETE("/experiences/:id", expCtrl.DeleteExperience)

		// Educations & Organizations
		adminProtected.GET("/educations", eduCtrl.ListEducations)
		adminProtected.POST("/educations", eduCtrl.CreateEducation)
		adminProtected.GET("/educations/:id", eduCtrl.GetEducation)
		adminProtected.PUT("/educations/:id", eduCtrl.UpdateEducation)
		adminProtected.DELETE("/educations/:id", eduCtrl.DeleteEducation)

		// Skills
		adminProtected.GET("/skills", skillCtrl.ListSkills)
		adminProtected.POST("/skills", skillCtrl.CreateSkill)
		adminProtected.GET("/skills/:id", skillCtrl.GetSkill)
		adminProtected.PUT("/skills/:id", skillCtrl.UpdateSkill)
		adminProtected.DELETE("/skills/:id", skillCtrl.DeleteSkill)

		// Skill Categories
		adminProtected.GET("/skill-categories", skillCtrl.ListCategories)
		adminProtected.POST("/skill-categories", skillCtrl.CreateCategory)
		adminProtected.PUT("/skill-categories/:id", skillCtrl.UpdateCategory)
		adminProtected.DELETE("/skill-categories/:id", skillCtrl.DeleteCategory)

		// Media Library
		adminProtected.GET("/media", mediaCtrl.ListMedia)
		adminProtected.POST("/media/upload", mediaCtrl.UploadMedia)
		adminProtected.DELETE("/media/:id", mediaCtrl.DeleteMedia)

		// Pages
		adminProtected.GET("/pages", pageCtrl.ListPages)
		adminProtected.POST("/pages", pageCtrl.CreatePage)
		adminProtected.GET("/pages/:id", pageCtrl.GetPage)
		adminProtected.PUT("/pages/:id", pageCtrl.UpdatePage)
		adminProtected.DELETE("/pages/:id", pageCtrl.DeletePage)

		// Site Settings
		adminProtected.GET("/site-settings", siteCtrl.GetSiteSetting)
		adminProtected.PUT("/site-settings", siteCtrl.UpdateSiteSetting)

		// SEO Settings
		adminProtected.GET("/seo-settings", seoCtrl.ListSeoSettings)
		adminProtected.GET("/seo-settings/by-path", seoCtrl.GetSeoSettingByPath)
		adminProtected.POST("/seo-settings", seoCtrl.UpsertSeoSetting)

		// Social Links
		adminProtected.GET("/social-links", socialCtrl.ListSocialLinks)
		adminProtected.POST("/social-links", socialCtrl.CreateSocialLink)
		adminProtected.PUT("/social-links/:id", socialCtrl.UpdateSocialLink)
		adminProtected.DELETE("/social-links/:id", socialCtrl.DeleteSocialLink)

		// AI Settings
		adminProtected.GET("/ai-settings", aiCtrl.GetAISetting)
		adminProtected.PUT("/ai-settings", aiCtrl.UpdateAISetting)

		// Chat Sessions
		adminProtected.GET("/chat-sessions", chatCtrl.ListChatSessions)
		adminProtected.GET("/chat-sessions/:id", chatCtrl.GetChatSession)
		adminProtected.DELETE("/chat-sessions/:id", chatCtrl.DeleteChatSession)
		adminProtected.DELETE("/chat-sessions", chatCtrl.DeleteAllChatSessions)

		// Contacts & Messages
		adminProtected.GET("/contacts", contactCtrl.ListContacts)
		adminProtected.GET("/contacts/stats", contactCtrl.GetUnreadStats)
		adminProtected.GET("/contacts/:id", contactCtrl.GetContact)
		adminProtected.PUT("/contacts/:id/status", contactCtrl.UpdateContactStatus)
		adminProtected.DELETE("/contacts/:id", contactCtrl.DeleteContact)

		// User Management
		adminProtected.GET("/users", userCtrl.ListUsers)
		adminProtected.POST("/users", userCtrl.CreateUser)
		adminProtected.GET("/users/:id", userCtrl.GetUser)
		adminProtected.PUT("/users/:id", userCtrl.UpdateUser)
		adminProtected.DELETE("/users/:id", userCtrl.DeleteUser)

		// Webmail & Mailbox (Brevo)
		adminProtected.GET("/mailbox/threads", mailboxCtrl.ListEmails)
		adminProtected.GET("/mailbox/threads/:id", mailboxCtrl.GetThread)
		adminProtected.POST("/mailbox/send", mailboxCtrl.SendEmail)
		adminProtected.POST("/mailbox/reply", mailboxCtrl.ReplyEmail)
		adminProtected.PUT("/mailbox/threads/:id/status", mailboxCtrl.UpdateThreadStatus)
		adminProtected.DELETE("/mailbox/threads/:id", mailboxCtrl.DeleteThread)
		adminProtected.GET("/mailbox/stats", mailboxCtrl.GetMailboxStats)
		adminProtected.GET("/mailbox/settings", mailboxCtrl.GetSettings)
		adminProtected.PUT("/mailbox/settings", mailboxCtrl.UpdateSettings)

		// Game Tools Management
		adminProtected.GET("/game-tools", gameToolCtrl.ListGameTools)
		adminProtected.GET("/game-tools/:id", gameToolCtrl.GetGameTool)
		adminProtected.POST("/game-tools", gameToolCtrl.CreateGameTool)
		adminProtected.PUT("/game-tools/:id", gameToolCtrl.UpdateGameTool)
		adminProtected.DELETE("/game-tools/:id", gameToolCtrl.DeleteGameTool)
		adminProtected.PATCH("/game-tools/:id/toggle", gameToolCtrl.ToggleActive)

		// Global Tool Settings (On/Off switches, details edit, and popular toggle)
		adminProtected.GET("/tool-settings", gameToolCtrl.ListToolSettings)
		adminProtected.PUT("/tool-settings/:slug", gameToolCtrl.UpdateToolSetting)
		adminProtected.PATCH("/tool-settings/:slug/toggle", gameToolCtrl.ToggleToolSetting)
		adminProtected.PATCH("/tool-settings/:slug/popular", gameToolCtrl.ToggleToolPopular)
	}
}
