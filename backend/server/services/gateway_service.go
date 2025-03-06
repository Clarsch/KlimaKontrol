package services

import (
	"klimakontrol/models"
	"klimakontrol/repositories"
)

type GatewayService struct {
	repo repositories.GatewayRepository
}

func NewGatewayService(repo repositories.GatewayRepository) *GatewayService {
	return &GatewayService{repo: repo}
}

func (s *GatewayService) GetAllGateways() ([]models.Gateway, error) {
	gateways, err := s.repo.FindAll()
	return gateways, err
}
