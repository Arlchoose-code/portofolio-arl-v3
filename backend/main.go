package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/database"
	"portfolio-arl-backend/middlewares"
	"portfolio-arl-backend/routes"
	"portfolio-arl-backend/structs"
	"portfolio-arl-backend/workers"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("Starting Portfolio Backend Service...")

	// 1. Load Configuration
	cfg := config.LoadConfig()

	// 2. Connect Database
	db, err := config.ConnectDatabase(cfg)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v\n", err)
	}

	// 3. AutoMigrate 20 Tables
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Fatal: Database migration failed: %v\n", err)
	}

	// 4. Run Data Seeders
	if err := database.Seed(db, cfg); err != nil {
		log.Printf("Warning: Seeder warning: %v\n", err)
	}

	// 5. Start Background Revalidation Worker
	workerCtx, workerCancel := context.WithCancel(context.Background())
	defer workerCancel()
	worker := workers.NewRevalidationWorker(cfg, db)
	go worker.Start(workerCtx)

	// 6. Setup Gin
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.CustomRecovery(func(c *gin.Context, recovered any) {
		log.Printf("Panic recovered: %v\n", recovered)
		c.AbortWithStatusJSON(http.StatusInternalServerError, structs.ErrorResponse("Internal server error"))
	}))

	r.Use(middlewares.RequestIDMiddleware())
	r.Use(middlewares.SecurityHeadersMiddleware())
	r.Use(middlewares.CORSMiddleware(cfg))

	// Static storage file serving
	_ = os.MkdirAll(cfg.Storage.Path, os.ModePerm)
	r.Static("/storage/media", cfg.Storage.Path)

	// Custom 404 & 405 error responses
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, structs.ErrorResponse("Route not found"))
	})
	r.NoMethod(func(c *gin.Context) {
		c.JSON(http.StatusMethodNotAllowed, structs.ErrorResponse("Method not allowed"))
	})

	// 7. Register API Routes
	routes.SetupRoutes(r, cfg)

	// 8. Start HTTP Server with Graceful Shutdown
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.App.Port),
		Handler: r,
	}

	go func() {
		log.Printf("Backend API server listening on http://localhost:%s\n", cfg.App.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down backend server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v\n", err)
	}

	workerCancel()
	log.Println("Backend server exited cleanly.")
}
