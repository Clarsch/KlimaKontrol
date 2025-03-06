package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type GatewayRepository interface {
	FindAll() ([]models.Gateway, error)
}

type gatewayRepository struct {
	db *gorm.DB
}

func NewGatewayRepository(db *gorm.DB) GatewayRepository {
	return &gatewayRepository{db: db}
}

func (r *gatewayRepository) FindAll() ([]models.Gateway, error) {
	var gateways []models.Gateway
	err := r.db.Model(&models.Gateway{}).Find(&gateways).Error
	return gateways, err
}
