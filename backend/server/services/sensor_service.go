package services

import (
	"klimakontrol/models"
	"klimakontrol/repositories"
)

type SensorService struct {
	repo repositories.SensorRepository
}

func NewSensorService(repo repositories.SensorRepository) *SensorService {
	return &SensorService{repo: repo}
}

func (s *SensorService) GetAllSensors() ([]models.SensorDB, error) {
	sensors, err := s.repo.FindAll()
	return sensors, err
}
