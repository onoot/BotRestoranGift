// src/bot/instance.js
let botInstance = null;

function setBot(bot) {
  botInstance = bot;
}

function getBot() {
  if (!botInstance) {
    throw new Error('Bot not initialized yet!');
  }
  return botInstance;
}

module.exports = { setBot, getBot };