package services

import (
	"klimakontrol/models"
	"klimakontrol/repositories"
)

type AreaService struct {
	repo repositories.AreaRepository
}

func NewAreaService(repo repositories.AreaRepository) *AreaService {
	return &AreaService{repo: repo}
}

func (s *AreaService) GetAllAreas() ([]models.Area, error) {
	areas, err := s.repo.FindAll()
	return areas, err
}
