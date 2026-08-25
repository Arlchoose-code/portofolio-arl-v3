package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"portfolio-arl-backend/config"
	"portfolio-arl-backend/workers"
)

func main() {
	log.Println("Starting Revalidation Worker Service...")

	cfg := config.LoadConfig()
	db, err := config.ConnectDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v\n", err)
	}

	worker := workers.NewRevalidationWorker(cfg, db)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go worker.Start(ctx)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down worker...")
	cancel()
}
