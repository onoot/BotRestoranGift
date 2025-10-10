// create-project-structure.js
const fs = require('fs');
const path = require('path');

const projectRoot = './telegram-check-bot';
const structure = {
  'src/bot/handlers': ['userHandlers.js', 'adminHandlers.js'],
  'src/bot/scenes': ['uploadScene.js'],
  'src/bot/keyboards': ['keyboards.js'],
  'src/bot': ['bot.js'],
  'src/db/models': ['User.js', 'Receipt.js'],
  'src/db': ['database.js'],
  'src/services': ['receiptService.js', 'drawService.js', 'exportService.js'],
  'src/config': ['botConfig.js', 'paths.js'],
  'src/storage/receipts': [],
  'src/utils': ['excelExporter.js'],
  'src': ['app.js'],
};

function createDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Создана папка: ${dir}`);
  }
}

function createFile(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content.trim() || '// TODO', 'utf8');
    console.log(`📄 Создан файл: ${filePath}`);
  }
}

// Создаём корень
createDir(projectRoot);

// Создаём структуру
for (const [dir, files] of Object.entries(structure)) {
  const fullDir = path.join(projectRoot, dir);
  createDir(fullDir);
  for (const file of files) {
    createFile(path.join(fullDir, file));
  }
}

// Корневые файлы
const rootFiles = {
  '.env': `BOT_TOKEN=your_telegram_bot_token_here
ADMIN_IDS=123456789,987654321
DATABASE_URL=sqlite://./src/storage/database.sqlite
`,
  '.gitignore': `node_modules/
.env
src/storage/receipts/
*.log
`,
  'package.json': JSON.stringify(
    {
      name: "telegram-check-bot",
      version: "1.0.0",
      description: "Telegram bot for receipt upload and lottery participation",
      main: "src/app.js",
      scripts: {
        start: "node src/app.js",
        dev: "nodemon src/app.js"
      },
      dependencies: {
        "telegraf": "^4.16.3",
        "sqlite3": "^5.1.7",
        "sequelize": "^6.37.3",
        "exceljs": "^4.4.0",
        "dotenv": "^16.4.5"
      },
      devDependencies: {
        "nodemon": "^3.1.0"
      }
    },
    null,
    2
  ),
  'README.md': `# Telegram Check Bot

Бот для загрузки чеков и участия в розыгрышах.
`
};

for (const [file, content] of Object.entries(rootFiles)) {
  createFile(path.join(projectRoot, file), content);
}

console.log('\n✅ Структура проекта успешно создана!');
console.log('Перейдите в папку telegram-check-bot и выполните:');
console.log('npm install');