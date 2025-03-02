package routes

import (
	"klimakontrol/services"

	"github.com/gofiber/fiber/v2"
)

func AreaRoutes(app *fiber.App, services services.Services) {

	app.Get("/areas", func(c *fiber.Ctx) error {
		areas, err := services.AreaService.GetAllAreas()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(areas)
	})

}
