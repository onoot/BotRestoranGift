// src/db/models/Receipt.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Receipt = sequelize.define('Receipt', {
    telegramId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: false,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    timestamps: true,
    tableName: 'Receipts',
  });

  Receipt.associate = (models) => {
    Receipt.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Receipt;
};