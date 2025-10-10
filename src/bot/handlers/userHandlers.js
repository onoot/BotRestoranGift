// src/bot/handlers/userHandlers.js
const { mainMenu, backToMain } = require('../keyboards/keyboards');
const { User } = require('../../db/database');
const { saveReceipt } = require('../../services/receiptService');
const { getMessages } = require('../../services/messageService');
const { getDrawSettings } = require('../../services/drawSettingsService'); 
const fs = require('fs');

async function startHandler(ctx) {
  const { id, username, first_name, last_name } = ctx.from;
  await User.upsert({
    telegramId: id,
    username: username || null,
    firstName: first_name || null,
    lastName: last_name || null,
  });

  const messages = await getMessages();
  return ctx.reply(messages.welcome, mainMenu);
}

async function infoHandler(ctx) {
  const messages = await getMessages();
  return ctx.answerCbQuery().then(() => 
    ctx.editMessageText(messages.info, backToMain)
  );
}

async function offerHandler(ctx) {
  const messages = await getMessages();
  return ctx.answerCbQuery().then(() =>
    ctx.editMessageText(messages.offer, backToMain)
  );
}

async function drawInfoHandler(ctx) {
  const settings = await getDrawSettings();
  const text = settings.description || 'Розыгрыш временно недоступен.';
  return ctx.answerCbQuery().then(() => ctx.editMessageText(text, backToMain));
}

async function confirmReceiptHandler(ctx) {
  const data = ctx.callbackQuery.data;

  // ⚠️ Сразу отвечаем на callback, чтобы не было ошибки таймаута
  if (data === 'confirm_receipt') {
    await ctx.answerCbQuery('✅ Обработка...'); // ← ОТВЕТ СРАЗУ
  } else if (data === 'cancel_receipt') {
    await ctx.answerCbQuery('❌ Отмена...'); // ← ОТВЕТ СРАЗУ
  }

  if (!ctx.session.receiptData) {
    // Уже ответили, просто редактируем сообщение
    return ctx.editMessageText('❌ Сессия устарела. Попробуйте снова.', backToMain);
  }

  const { photoPath, orderId, amount } = ctx.session.receiptData;

  if (data === 'confirm_receipt') {
    try {
      await saveReceipt(ctx.from.id, photoPath, orderId, amount);
      const messages = await getMessages();
      await ctx.editMessageText(
        messages.reward || '✅ Чек успешно загружен! Спасибо за участие!',
        backToMain
      );

      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    } catch (e) {
      console.error('Ошибка сохранения чека:', e);
      await ctx.editMessageText(
        '❌ Не удалось сохранить чек. Обратитесь к администратору.',
        backToMain
      );
    }
  } else if (data === 'cancel_receipt') {
    await ctx.editMessageText('❌ Загрузка чека отменена.', backToMain);
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }

  delete ctx.session.receiptData;
}

module.exports = {
  startHandler,
  infoHandler,
  offerHandler,
  drawInfoHandler,
  confirmReceiptHandler,
};