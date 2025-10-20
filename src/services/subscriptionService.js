// src/services/subscriptionService.js
const { CHANNEL_USERNAME } = require('../config/botConfig'); // например: '@my_promo_channel'

async function checkUserSubscription(telegram, userId) {
  try {
    const member = await telegram.getChatMember("@g43gb34tg3", userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (error) {
    console.error('Ошибка проверки подписки:', error.message);
    return false;
  }
}

module.exports = { checkUserSubscription };