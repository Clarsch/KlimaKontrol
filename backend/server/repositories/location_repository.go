package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type LocationRepository interface {
	FindAll() ([]models.Location, error)
	Create([]models.Location) error
}

type locationRepository struct {
	db *gorm.DB
}

func NewLocationRepository(db *gorm.DB) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) FindAll() ([]models.Location, error) {
	var locationDBs []models.LocationDB
	err := r.db.Model(&models.LocationDB{}).Find(&locationDBs).Error
	locations := models.ConvertToLocationsFromDB(locationDBs)
	return locations, err
}

func (r *locationRepository) Create(locations []models.Location) error {
	locationDBs := models.ConvertLocationsToDB(locations)
	err := r.db.Model(&models.LocationDB{}).Create(&locationDBs).Error
	return err
}
