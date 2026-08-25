package database

import (
	"log"

	"portfolio-arl-backend/models"
	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations for all 20 tables...")
	err := db.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.PersonalAccessToken{},
		&models.SiteSetting{},
		&models.SeoSetting{},
		&models.SocialLink{},
		&models.ProjectCategory{},
		&models.Project{},
		&models.ProjectImage{},
		&models.Certificate{},
		&models.Experience{},
		&models.Education{},
		&models.SkillCategory{},
		&models.Skill{},
		&models.Media{},
		&models.Page{},
		&models.RevalidationJob{},
		&models.AISetting{},
		&models.ChatSession{},
		&models.ChatMessage{},
		&models.ContactMessage{},
		&models.EmailSetting{},
		&models.EmailThread{},
		&models.EmailMessage{},
		&models.PasswordResetToken{},
		&models.GameTool{},
		&models.ToolSetting{},
	)
	if err != nil {
		log.Printf("Migration failed: %v\n", err)
		return err
	}

	log.Println("Database migration completed successfully.")
	return nil
}
