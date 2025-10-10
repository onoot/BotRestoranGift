const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  }
);

// Инициализация моделей
const User = require('./models/User')(sequelize);
const Receipt = require('./models/Receipt')(sequelize);

// Ассоциации
User.associate({ Receipt });
Receipt.associate({ User });

// Экспортируем ВСЁ
module.exports = {
  sequelize,
  User,
  Receipt,
};