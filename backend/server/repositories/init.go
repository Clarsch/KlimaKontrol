package repositories

import (
	"gorm.io/gorm"
)

type Repositories struct {
	UserRepository UserRepository
}

func InitRepositories(db *gorm.DB) Repositories {
	userRepo := NewUserRepository(db)
	//    roleRepo := NewRoleRepository(db) // Assume you have a similar repo
	return Repositories{
		UserRepository: userRepo,
	} //, roleRepo
}
