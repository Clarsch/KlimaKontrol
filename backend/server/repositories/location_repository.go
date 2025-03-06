package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type LocationRepository interface {
	FindAll() ([]models.Location, error)
}

type locationRepository struct {
	db *gorm.DB
}

func NewLocationRepository(db *gorm.DB) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) FindAll() ([]models.Location, error) {
	var locations []models.Location
	err := r.db.Model(&models.Location{}).Find(&locations).Error
	return locations, err
}


func 