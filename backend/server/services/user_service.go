package services

import (
	"klimakontrol/models"
	"klimakontrol/repositories"
)

type UserService struct {
	repo repositories.UserRepository
}

func NewUserService(repo repositories.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) RegisterUser(username, email string) error {
	user := &models.User{Username: username, Email: email}
	return s.repo.Create(user)
}

func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	return s.repo.FindByID(id)
}

// Other service methods...
