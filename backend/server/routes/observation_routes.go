package routes

import (
	"klimakontrol/services"

	"github.com/gofiber/fiber/v2"
)

func ObservationRoutes(app *fiber.App, services services.Services) {

	app.Post("/observation", func(c *fiber.Ctx) error {
		// Handler for creating a user, using userService
		return c.SendString("User created")
	})

	app.Post("/observation", func(c *fiber.Ctx) error {
		/*var observation Observation

		// Parse the incoming JSON
		if err := c.BodyParser(&observation); err != nil {
			return c.Status(fiber.StatusBadRequest).SendString("Invalid JSON")
		}

		// Pass the observation to the observation service for database creation
		err := services.ObservationService.CreateObservation(observation)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).SendString("Failed to create observation")
		}
		*/
		return c.Status(fiber.StatusCreated).SendString("Observation created")
	})

	app.Get("/observations/:id", func(c *fiber.Ctx) error {
		// Use userService to handle the request
		return c.SendString("User fetched by ID")
	})

}
