package routes

import (
	"portfolio-arl-backend/controllers/public"
	"github.com/gin-gonic/gin"
)

func RegisterPublicRoutes(r *gin.RouterGroup) {
	projectCtrl := public.NewProjectController()
	certCtrl := public.NewCertificateController()
	expCtrl := public.NewExperienceController()
	eduCtrl := public.NewEducationController()
	skillCtrl := public.NewSkillController()
	pageCtrl := public.NewPageController()
	seoCtrl := public.NewSeoController()
	settingsCtrl := public.NewSettingsController()
	chatCtrl := public.NewChatController()
	contactCtrl := public.NewContactController()

	// Projects
	r.GET("/projects", projectCtrl.ListProjects)
	r.GET("/projects/:slug", projectCtrl.GetProjectBySlug)

	// Certificates
	r.GET("/certificates", certCtrl.ListCertificates)

	// Experiences
	r.GET("/experiences", expCtrl.ListExperiences)

	// Educations
	r.GET("/educations", eduCtrl.ListEducations)

	// Skills
	r.GET("/skills", skillCtrl.ListSkills)

	// Pages
	r.GET("/pages/:slug", pageCtrl.GetPageBySlug)

	// SEO & Settings
	r.GET("/seo", seoCtrl.GetSeoByPath)
	r.GET("/settings", settingsCtrl.GetSiteInfo)

	// Contact Form
	r.POST("/contact", contactCtrl.SubmitContact)

	// Email Inbound Webhooks
	webhookCtrl := public.NewEmailWebhookController()
	r.POST("/webhooks/brevo/inbound", webhookCtrl.HandleBrevoInbound)
	r.POST("/webhooks/resend/inbound", webhookCtrl.HandleResendInbound)

	// AI Chatbot
	r.POST("/chat/session", chatCtrl.CreateSession)
	r.POST("/chat/send", chatCtrl.SendMessage)
	r.POST("/chat/stream", chatCtrl.SendMessage)
	r.GET("/chat/history", chatCtrl.GetHistory)
	r.DELETE("/chat/session", chatCtrl.DeleteSession)

	// Game & Web Tools
	gameCtrl := public.NewGameToolController()
	ytCtrl := public.NewYouTubeToolController()
	r.GET("/tools/settings", gameCtrl.GetToolSettings)
	r.GET("/tools/games", gameCtrl.ListGames)
	r.GET("/tools/games/:slug", gameCtrl.GetGameBySlug)
	r.GET("/tools/game-check", gameCtrl.CheckNickname)
	r.GET("/tools/youtube/convert", ytCtrl.Convert)
	r.GET("/tools/youtube/download", ytCtrl.Download)
	r.GET("/tools/youtube/thumbnail", ytCtrl.Thumbnail)
}
