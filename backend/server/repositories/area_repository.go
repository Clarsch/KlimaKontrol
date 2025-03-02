package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type AreaRepository interface {
	FindAll() ([]models.Area, error)
}

type areaRepository struct {
	db *gorm.DB
}

func NewAreaRepository(db *gorm.DB) AreaRepository {
	return &areaRepository{db: db}
}

func (r *areaRepository) FindAll() ([]models.Area, error) {
	var areas []models.Area
	err := r.db.Model(&models.Area{}).Find(&areas).Error
	return areas, err
}
