// src/services/messageService.js
const fs = require('fs').promises;
const path = require('path');

const MESSAGES_PATH = path.join(__dirname, '..', 'config', 'messages.json');

async function getMessages() {
  const data = await fs.readFile(MESSAGES_PATH, 'utf8');
  return JSON.parse(data);
}

async function updateMessage(key, value) {
  const messages = await getMessages();
  if (!messages.hasOwnProperty(key)) {
    throw new Error(`Ключ "${key}" не найден в messages.json`);
  }
  messages[key] = value;
  await fs.writeFile(MESSAGES_PATH, JSON.stringify(messages, null, 2), 'utf8');
}

module.exports = { getMessages, updateMessage };