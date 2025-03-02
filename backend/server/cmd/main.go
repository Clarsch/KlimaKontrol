package main

import (
	"fmt"
	"klimakontrol/config"
	"klimakontrol/repositories"
	"klimakontrol/routes"
	"klimakontrol/services"

	"github.com/gofiber/fiber/v2"
)

func main() {

	// Init Database Connection
	db, err := config.ConnectDB()
	if err != nil {
		panic(fmt.Errorf("Failed to database setup: %v", err))
	}

	// Init all Repositories
	repos := repositories.InitRepositories(db)

	// Init all Services
	services := services.InitServices(repos)

	//Create new Fiber app
	app := fiber.New()

	// Init all Routes
	routes.InitRoutes(app, services) // Setting up routes

	// Start the server
	if err := app.Listen(":8080"); err != nil {
		fmt.Printf("Error starting server: %v", err)
	}

	// Log the shutdown
	fmt.Println("Server stopped.")

}
