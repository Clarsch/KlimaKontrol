package services

import (
	"klimakontrol/models"
	"klimakontrol/repositories"
)

type LocationService struct {
	repo repositories.LocationRepository
}

func NewLocationService(repo repositories.LocationRepository) *LocationService {
	return &LocationService{repo: repo}
}

func (s *LocationService) GetAllLocations() ([]models.Location, error) {
	locations, err := s.repo.FindAll()
	return locations, err
}
