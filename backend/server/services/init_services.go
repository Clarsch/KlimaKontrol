package services

import "klimakontrol/repositories"

type Services struct {
	UserService        *UserService
	ObservationService *ObservationService
	//RoleService *RoleService // Add more services as needed
}

func InitServices(repos repositories.Repositories) Services {
	userService := NewUserService(repos.UserRepository)
	observationService := NewObservationService(repos.ObservationRepository)
	//roleService := NewRoleService(roleRepo) // Assume you have a similar service
	return Services{
		UserService:        userService,
		ObservationService: observationService,
		//RoleServices: roleService,
	}
}
