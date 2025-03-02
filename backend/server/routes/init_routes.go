package routes

import (
	"klimakontrol/services"

	"github.com/gofiber/fiber/v2"
)

func InitRoutes(app *fiber.App, services services.Services) {

	AreaRoutes(app, services)
	UserRoutes(app, services)
	ObservationRoutes(app, services)

}
