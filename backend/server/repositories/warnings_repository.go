package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type WarningRepository interface {
	FindAll() ([]models.Warning, error)
}

type warningRepository struct {
	db *gorm.DB
}

func NewWarningRepository(db *gorm.DB) WarningRepository {
	return &warningRepository{db: db}
}

func (r *warningRepository) FindAll() ([]models.Warning, error) {
	var warnings []models.Warning
	err := r.db.Model(&models.Warning{}).Find(&warnings).Error
	return warnings, err
}
