package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type ObservationRepository interface {
	Create(observation *models.ObservationDB) error
	FindByID(id uint) (*models.ObservationDB, error)
	FindAll() ([]models.ObservationDB, error)
	//Update(observation *models.Observation) error
}

type observationRepository struct {
	db *gorm.DB
}

func NewObservationRepository(db *gorm.DB) ObservationRepository {
	return &observationRepository{db: db}
}

func (r *observationRepository) Create(user *models.ObservationDB) error {
	return r.db.Create(user).Error
}

func (r *observationRepository) FindByID(id uint) (*models.ObservationDB, error) {
	var observation models.ObservationDB
	err := r.db.First(&observation, id).Error
	return &observation, err
}

func (r *observationRepository) FindAll() ([]models.ObservationDB, error) {
	var observations []models.ObservationDB
	err := r.db.Find(&observations).Error
	return observations, err
}

/*
func (r *observationRepository) Update(observation *models.Observation) error {
	return r.db.Save(observation).Error
}
*/

/*
func (r *observationRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}
*/
