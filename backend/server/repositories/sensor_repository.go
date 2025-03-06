package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type SensorRepository interface {
	FindAll() ([]models.Sensor, error)
}

type sensorRepository struct {
	db *gorm.DB
}

func NewSensorRepository(db *gorm.DB) SensorRepository {
	return &sensorRepository{db: db}
}

func (r *sensorRepository) FindAll() ([]models.Sensor, error) {
	var sensors []models.Sensor
	err := r.db.Model(&models.Sensor{}).Find(&sensors).Error
	return sensors, err
}
