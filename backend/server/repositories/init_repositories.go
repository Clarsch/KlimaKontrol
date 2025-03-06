package repositories

import (
	"gorm.io/gorm"
)

type Repositories struct {
	AreaRepository        AreaRepository
	GatewayRepository     GatewayRepository
	LocationRepository    LocationRepository
	ObservationRepository ObservationRepository
	SensorRepository      SensorRepository
	UserRepository        UserRepository
	WarningRepository     WarningRepository
}

func InitRepositories(db *gorm.DB) Repositories {
	areaRepo := NewAreaRepository(db)
	gatewayRepo := NewGatewayRepository(db)
	locationRepo := NewLocationRepository(db)
	observationRepo := NewObservationRepository(db)
	sensorRepo := NewSensorRepository(db)
	userRepo := NewUserRepository(db)
	warningRepo := NewWarningRepository(db)

	return Repositories{
		AreaRepository:        areaRepo,
		GatewayRepository:     gatewayRepo,
		LocationRepository:    locationRepo,
		ObservationRepository: observationRepo,
		SensorRepository:      sensorRepo,
		UserRepository:        userRepo,
		WarningRepository:     warningRepo,
	}

}
