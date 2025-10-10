// src/services/drawService.js
const { Receipt } = require('../db/database');
const { Op } = require('sequelize');
const { getDrawSettings } = require('./drawSettingsService');
const { getBot } = require('../bot/instance');
const { getMessages } = require('./messageService');

async function runDraw() {
  const settings = await getDrawSettings();

  if (!settings.enabled) {
    return { success: false, message: 'Розыгрыш временно отключён.' };
  }

  const where = {
    amount: { [Op.gte]: settings.minAmount },
  };

  if (settings.maxAgeDays !== null && settings.maxAgeDays > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.maxAgeDays - 1);
    cutoffDate.setHours(0, 0, 0, 0);
    where.createdAt = { [Op.gte]: cutoffDate };
  }

  // Получаем все подходящие чеки
  const validReceipts = await Receipt.findAll({ where, raw: true });

  if (validReceipts.length === 0) {
    return { success: false, message: 'Нет подходящих чеков для розыгрыша.' };
  }

  // Уникальные telegramId из чеков
  const telegramIds = [...new Set(validReceipts.map(r => r.telegramId))];
  const allParticipants = telegramIds.map(id => ({ telegramId: id, username: null }));

  if (allParticipants.length === 0) {
    return { success: false, message: 'Нет участников для розыгрыша.' };
  }

  // Количество победителей
  const maxWinners = Math.min(settings.maxWinners || 1, allParticipants.length);

  // Перемешиваем и выбираем победителей
  const shuffled = [...allParticipants].sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, maxWinners);
  const winnerIds = new Set(winners.map(w => w.telegramId));
  const losers = allParticipants.filter(p => !winnerIds.has(p.telegramId));

  // Отправка сообщений
  const messages = await getMessages();
  const winnerMsg = messages.winnerMessage || '🏆 Поздравляем! Вы выиграли!';
  const loserMsg = messages.loserMessage || '😔 В этот раз не повезло. Участвуйте снова!';

  const bot = getBot();

  // Отправка победителям
  for (const winner of winners) {
    if (!winner.telegramId) continue;
    try {
      await bot.telegram.sendMessage(winner.telegramId, winnerMsg);
    } catch (e) {
      console.warn(`Не отправлено победителю ${winner.telegramId}:`, e.message);
    }
  }

  // Отправка проигравшим
  for (const loser of losers) {
    if (!loser.telegramId) continue;
    try {
      await bot.telegram.sendMessage(loser.telegramId, loserMsg);
    } catch (e) {
      console.warn(`Не отправлено проигравшему ${loser.telegramId}:`, e.message);
    }
  }

  // Для отображения в админке: попытаемся получить username из Users (опционально)
  const { User } = require('../db/database');
  let winnersWithUsername = winners;
  try {
    const users = await User.findAll({
      where: { telegramId: { [Op.in]: winners.map(w => w.telegramId) } },
      raw: true,
    });
    const userMap = new Map(users.map(u => [u.telegramId, u.username]));
    winnersWithUsername = winners.map(w => ({
      telegramId: w.telegramId,
      username: userMap.get(w.telegramId) || null,
    }));
  } catch (e) {
    console.warn('Не удалось загрузить username для победителей:', e.message);
  }

  return {
    success: true,
    winners: winnersWithUsername,
    totalParticipants: allParticipants.length,
    totalWinners: winners.length,
  };
}

module.exports = { runDraw };