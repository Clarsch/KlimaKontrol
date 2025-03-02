package repositories

import (
	"gorm.io/gorm"
)

type Repositories struct {
	UserRepository        UserRepository
	ObservationRepository ObservationRepository
	AreaRepository        AreaRepository
}

func InitRepositories(db *gorm.DB) Repositories {
	userRepo := NewUserRepository(db)
	observationRepo := NewObservationRepository(db)
	areaRepo := NewAreaRepository(db)

	return Repositories{
		UserRepository:        userRepo,
		ObservationRepository: observationRepo,
		AreaRepository:        areaRepo,
	}
}
