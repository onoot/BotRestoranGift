// src/app.js
const {sequelize} = require('./db/database');
const bot = require('./bot/bot');
const { setBot } = require('./bot/instance.js'); 
const fs = require('fs-extra');
const { RECEIPTS_DIR } = require('./config/paths');

async function main() {
  await fs.ensureDir(RECEIPTS_DIR);
  await sequelize.sync();

  // Устанавливаем глобальный экземпляр бота ДО запуска
  setBot(bot);

  console.log('✅ Бот запускается...');
  await bot.launch();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch(console.error);