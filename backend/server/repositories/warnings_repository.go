package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type WarningRepository interface {
	FindAll() ([]models.WarningDB, error)
}

type warningRepository struct {
	db *gorm.DB
}

func NewWarningRepository(db *gorm.DB) WarningRepository {
	return &warningRepository{db: db}
}

func (r *warningRepository) FindAll() ([]models.WarningDB, error) {
	var warnings []models.WarningDB
	err := r.db.Model(&models.WarningDB{}).Find(&warnings).Error
	return warnings, err
}
