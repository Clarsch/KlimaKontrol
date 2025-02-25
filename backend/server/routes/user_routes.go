package routes

import (
	"klimakontrol/services"

	"github.com/gofiber/fiber/v2"
)

func SetupRouter(app *fiber.App, userService *services.UserService) {

	// User routes
	app.Post("/users", func(c *fiber.Ctx) error {
		// Handler for creating a user, using userService
		return c.SendString("User created")
	})

	app.Get("/users/:id", func(c *fiber.Ctx) error {
		// Handler for getting a user by ID
		// Use userService to handle the request
		return c.SendString("User fetched by ID")
	})

}
