package models

type Roles struct {
	RoleID      int    `gorm:"primaryKey;autoIncrement"`
	RoleName    string `gorm:"size:50;not null;unique"`
	Description string `gorm:"size:255"`
}
