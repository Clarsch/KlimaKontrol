package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type GatewayRepository interface {
	FindAll() ([]models.GatewayDB, error)
}

type gatewayRepository struct {
	db *gorm.DB
}

func NewGatewayRepository(db *gorm.DB) GatewayRepository {
	return &gatewayRepository{db: db}
}

func (r *gatewayRepository) FindAll() ([]models.GatewayDB, error) {
	var gateways []models.GatewayDB
	err := r.db.Model(&models.GatewayDB{}).Find(&gateways).Error
	return gateways, err
}
