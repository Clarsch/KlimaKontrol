package routes

import (
	"klimakontrol/services"

	"github.com/gofiber/fiber/v2"
)

func UserRoutes(app *fiber.App, services services.Services) {

	// User routes

	app.Post("/users", func(c *fiber.Ctx) error {

		// Handler for creating a user, using userService

		return c.SendString("User created")

	})

	// Role routes

	app.Post("/roles", func(c *fiber.Ctx) error {

		// Handler for creating a role, using roleService

		return c.SendString("User fetched by ID")

	})

}
