// src/bot/handlers/userHandlers.js
const { mainMenu, cencel, backToMain } = require('../keyboards/keyboards');
const { User } = require('../../db/database');
const { saveReceipt } = require('../../services/receiptService');
const { getMessages } = require('../../services/messageService');
const { getDrawSettings } = require('../../services/drawSettingsService'); 
const path = require('path');

const fs = require('fs');
const MAX_LENGTH = 4096;

function splitText(text) {
  const parts = [];
  for (let i = 0; i < text.length; i += MAX_LENGTH) {
    parts.push(text.slice(i, i + MAX_LENGTH));
  }
  return parts;
}

async function startHandler(ctx) {
  const { id, username, first_name, last_name } = ctx.from;
  await User.upsert({
    telegramId: id,
    username: username || null,
    firstName: first_name || null,
    lastName: last_name || null,
  });

  const messages = await getMessages();

  return ctx.replyWithPhoto(
    { source: path.join(__dirname, '../../../assets/welcome.jpg') },
    {
      caption: messages.welcome,
      ...mainMenu
    }
  );
}
async function infoHandler(ctx) {
  const messages = await getMessages();
  return ctx.answerCbQuery().then(() => 
    ctx.editMessageText(messages.info, backToMain)
  );
}

async function offerHandler(ctx) {
  await ctx.answerCbQuery();

  try {
    await ctx.deleteMessage(); 
  } catch (e) {
  }

  const file = path.join(__dirname, '../../../assets/offer.docx');

  const sent = await ctx.replyWithDocument(
    { source: file },
    {
      caption: 'Вы соглашаетесь с условиями оферты в прикрепленном файле.',
      ...backToMain,
    }
  );

  // Сохраняем ID сообщения с офертой
  ctx.session.offerMessageId = sent.message_id;
}
async function drawInfoHandler(ctx) {
  const {drawInfo} = await getMessages();
  const text = drawInfo || 'Розыгрыш временно недоступен.';
  return ctx.answerCbQuery().then(() => ctx.editMessageText(text, backToMain));
}

async function confirmReceiptHandler(ctx) {
  const data = ctx.callbackQuery.data;

  // ⚠️ Сразу отвечаем на callback, чтобы не было ошибки таймаута
  if (data === 'confirm_receipt') {
    await ctx.answerCbQuery('✅ Обработка...');
  } else if (data === 'cancel_receipt') {
    await ctx.answerCbQuery('❌ Загрузка отменена!');
  }

  if (!ctx.session.receiptData) {
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
    delete ctx.session.receiptData;
  } else if (data === 'cancel_receipt') {
    // Отмена загрузки чека
    if (fs.existsSync(photoPath)) {
      try { fs.unlinkSync(photoPath); } catch (e) {}
    }
    delete ctx.session.receiptData;
    await ctx.editMessageText('❌ Загрузка чека отменена.', backToMain);
  }
}

async function cancelReceiptHandler(ctx) {
  // Удаляем данные о чеке из сессии
  if (ctx.session && ctx.session.receiptData) {
    // Если был загружен файл — удаляем
    const { photoPath } = ctx.session.receiptData;
    if (photoPath && fs.existsSync(photoPath)) {
      try { fs.unlinkSync(photoPath); } catch (e) {}
    }
    delete ctx.session.receiptData;
  }
  await ctx.reply('❌ Загрузка чека отменена.', require('../keyboards/keyboards').backToMain);
}

module.exports = {
  startHandler,
  infoHandler,
  offerHandler,
  drawInfoHandler,
  confirmReceiptHandler,
  cancelReceiptHandler,
};