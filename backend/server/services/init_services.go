package services

import (
	"klimakontrol/repositories"
)

type Services struct {
	AreaService        *AreaService
	GatewayService     *GatewayService
	LocationService    *LocationService
	ObservationService *ObservationService
	SensorService      *SensorService
	UserService        *UserService
	WarningService     *WarningService
}

func InitServices(repositories repositories.Repositories) Services {
	areaService := NewAreaService(repositories.AreaRepository)
	gatewayService := NewGatewayService(repositories.GatewayRepository)
	locationService := NewLocationService(repositories.LocationRepository)
	observationService := NewObservationService(repositories.ObservationRepository)
	sensorService := NewSensorService(repositories.SensorRepository)
	userService := NewUserService(repositories.UserRepository)
	warningService := NewWarningService(repositories.WarningRepository)

	return Services{
		AreaService:        areaService,
		GatewayService:     gatewayService,
		LocationService:    locationService,
		ObservationService: observationService,
		SensorService:      sensorService,
		UserService:        userService,
		WarningService:     warningService,
	}

}
