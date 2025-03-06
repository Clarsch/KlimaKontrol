package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type SensorRepository interface {
	FindAll() ([]models.SensorDB, error)
}

type sensorRepository struct {
	db *gorm.DB
}

func NewSensorRepository(db *gorm.DB) SensorRepository {
	return &sensorRepository{db: db}
}

func (r *sensorRepository) FindAll() ([]models.SensorDB, error) {
	var sensors []models.SensorDB
	err := r.db.Model(&models.SensorDB{}).Find(&sensors).Error
	return sensors, err
}
