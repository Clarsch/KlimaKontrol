package repositories

import (
	"gorm.io/gorm"
)

type Repositories struct {
	UserRepository        UserRepository
	ObservationRepository ObservationRepository
}

func InitRepositories(db *gorm.DB) Repositories {
	userRepo := NewUserRepository(db)
	observationRepo := NewObservationRepository(db)
	//    roleRepo := NewRoleRepository(db) // Assume you have a similar repo
	return Repositories{
		UserRepository:        userRepo,
		ObservationRepository: observationRepo,
	}
}
