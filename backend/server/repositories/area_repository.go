package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type AreaRepository interface {
	FindAll() ([]models.AreaDB, error)
}

type areaRepository struct {
	db *gorm.DB
}

func NewAreaRepository(db *gorm.DB) AreaRepository {
	return &areaRepository{db: db}
}

func (r *areaRepository) FindAll() ([]models.AreaDB, error) {
	var areas []models.AreaDB
	err := r.db.Model(&models.AreaDB{}).Find(&areas).Error
	return areas, err
}
