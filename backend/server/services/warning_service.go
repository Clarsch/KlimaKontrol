package services

import (
	"klimakontrol/models"
	"klimakontrol/repositories"
)

type WarningService struct {
	repo repositories.WarningRepository
}

func NewWarningService(repo repositories.WarningRepository) *WarningService {
	return &WarningService{repo: repo}
}

func (s *WarningService) GetAllWarnings() ([]models.Warning, error) {
	warnings, err := s.repo.FindAll()
	return warnings, err
}
