package routes

import (
	"klimakontrol/services"

	"github.com/gofiber/fiber/v2"
)

func LocationRoutes(app *fiber.App, services services.Services) {

	app.Get("/locations", func(c *fiber.Ctx) error {
		locations, err := services.LocationService.GetAllLocations()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(locations)
	})

}
