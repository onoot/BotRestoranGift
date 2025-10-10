// src/db/models/User.js
const { DataTypes } = require('sequelize');

// Экспортируем функцию, которая создаёт модель при передаче sequelize
module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    telegramId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'Users',
  });

  User.associate = (models) => {
    User.hasMany(models.Receipt, { foreignKey: 'userId', as: 'receipts' });
  };

  return User;
};