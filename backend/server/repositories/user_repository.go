package repositories

import (
	"klimakontrol/models"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *models.UserDB) error
	FindByID(id uint) (*models.UserDB, error)
	FindAll() ([]models.UserDB, error)
	Update(user *models.UserDB) error
	Delete(id uint) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.UserDB) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByID(id uint) (*models.UserDB, error) {
	var user models.UserDB
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *userRepository) FindAll() ([]models.UserDB, error) {
	var users []models.UserDB
	err := r.db.Find(&users).Error
	return users, err
}

func (r *userRepository) Update(user *models.UserDB) error {
	return r.db.Save(user).Error
}

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&models.UserDB{}, id).Error
}
