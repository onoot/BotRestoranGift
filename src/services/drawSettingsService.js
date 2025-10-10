const fs = require('fs').promises;
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', 'config', 'drawSettings.json');

const DEFAULT_SETTINGS = {
  minAmount: 2000,
  maxAgeDays: 30,
  maxWinners: 1,
  enabled: true,
  description: "Розыгрыш проводится ежемесячно. Каждый чек от 2000₽ = 1 билет."
};

async function ensureSettingsFile() {
  try {
    await fs.access(SETTINGS_PATH);
  } catch {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

async function getDrawSettings() {
  await ensureSettingsFile();
  const data = await fs.readFile(SETTINGS_PATH, 'utf8');
  return JSON.parse(data);
}

async function updateDrawSetting(key, value) {
  const settings = await getDrawSettings();
  if (!settings.hasOwnProperty(key)) {
    throw new Error(`Настройка "${key}" не существует`);
  }
  settings[key] = value;
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

module.exports = { getDrawSettings, updateDrawSetting };