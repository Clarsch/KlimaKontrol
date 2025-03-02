package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type ObservationRepository interface {
	Create(observation *models.Observation) error
	FindByID(id uint) (*models.Observation, error)
	FindAll() ([]models.Observation, error)
	//Update(observation *models.Observation) error
}

type observationRepository struct {
	db *gorm.DB
}

func NewObservationRepository(db *gorm.DB) ObservationRepository {
	return &observationRepository{db: db}
}

func (r *observationRepository) Create(user *models.Observation) error {
	return r.db.Create(user).Error
}

func (r *observationRepository) FindByID(id uint) (*models.Observation, error) {
	var observation models.Observation
	err := r.db.First(&observation, id).Error
	return &observation, err
}

func (r *observationRepository) FindAll() ([]models.Observation, error) {
	var observations []models.Observation
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
