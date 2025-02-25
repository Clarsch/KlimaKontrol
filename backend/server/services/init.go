package services

import "klimakontrol/repositories"

type Services struct {
	UserService *UserService
	//RoleService *RoleService // Add more services as needed
}

func InitServices(repos repositories.Repositories) Services {
	userService := NewUserService(repos.UserRepository)
	//roleService := NewRoleService(roleRepo) // Assume you have a similar service
	return Services{
		UserService: userService,
		//RoleServices: roleService,
	}
}
