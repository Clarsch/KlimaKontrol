package services

import "klimakontrol/repositories"

type Services struct {
	UserService        *UserService
	ObservationService *ObservationService
	AreaService        *AreaService
}

func InitServices(repos repositories.Repositories) Services {
	userService := NewUserService(repos.UserRepository)
	observationService := NewObservationService(repos.ObservationRepository)
	areaService := NewAreaService(repos.AreaRepository)
	//roleService := NewRoleService(roleRepo) // Assume you have a similar service
	return Services{
		UserService:        userService,
		ObservationService: observationService,
		AreaService:        areaService,
	}
}
