const { exportData } = require('../../services/exportService');
const { runDraw } = require('../../services/drawService');
const { getMessages, updateMessage } = require('../../services/messageService');
const { getDrawSettings, updateDrawSetting } = require('../../services/drawSettingsService');
const { mainMenu, adminMenu, backToAdmin, backToMain, drawSettingsMenu } = require('../keyboards/keyboards');

function isAdmin(ctx) {
  const { ADMIN_IDS } = require('../../config/botConfig');
  return ADMIN_IDS.includes(ctx.from.id);
}

async function adminStart(ctx) {
  if (!isAdmin(ctx)) {
    return ctx.reply('🚫 У вас нет доступа к админке.');
  }
  await ctx.reply('🔐 Панель администратора:', adminMenu);
}

async function handleEdit_texts(ctx) {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('🚫 Доступ запрещён');
  const messages = await getMessages();
  let text = '🔤 Доступные тексты для редактирования:\n\n';
  const keys = Object.keys(messages);
  for (const key of keys) {
    const preview = messages[key].split('\n')[0].substring(0, 40).replace(/\n/g, ' ');
    text += `• <code>${key}</code>: ${preview}...\n`;
  }
  text += '\n✏️ Чтобы изменить — отправьте команду:\n<code>/set_text ключ новое значение</code>';
  await ctx.answerCbQuery();
  await ctx.editMessageText(text, { parse_mode: 'HTML', ...backToAdmin });
}

async function handleSetTextCommand(ctx) {
  if (!isAdmin(ctx)) return ctx.reply('🚫 Доступ запрещён');
  const input = ctx.message.text.trim();
  const match = input.match(/^\/set_text\s+(\S+)\s+(.+)$/s);
  if (!match) {
    return ctx.reply('❌ Неверный формат.\n\nИспользуйте:\n<code>/set_text ключ "новое значение"</code>', { parse_mode: 'HTML' });
  }
  const [, key, value] = match;
  try {
    await updateMessage(key, value);
    await ctx.reply(`✅ Текст "${key}" успешно обновлён!`, backToAdmin);
  } catch (e) {
    await ctx.reply(`❌ Ошибка: ${e.message}`, backToAdmin);
  }
}

// === НОВОЕ: Запрос значения maxWinners ===
async function requestEditMaxWinners(ctx) {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('🚫 Доступ запрещён');
  ctx.session.awaitingDrawSetting = 'maxWinners';
  await ctx.answerCbQuery();
  await ctx.editMessageText('✏️ Введите количество победителей (целое число ≥ 1):', backToAdmin);
}

// === Настройки розыгрыша ===
async function showDrawSettings(ctx) {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('🚫 Доступ запрещён');
  const settings = await getDrawSettings();
  await ctx.answerCbQuery();
  await ctx.editMessageText('⚙️ Настройки розыгрыша:', drawSettingsMenu(settings));
}

async function toggleDrawEnabled(ctx) {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('🚫 Доступ запрещён');
  const settings = await getDrawSettings();
  await updateDrawSetting('enabled', !settings.enabled);
  const newSettings = await getDrawSettings();
  await ctx.answerCbQuery();
  await ctx.editMessageText('⚙️ Настройки розыгрыша:', drawSettingsMenu(newSettings));
}

async function requestEditMinAmount(ctx) {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('🚫 Доступ запрещён');
  ctx.session.awaitingDrawSetting = 'minAmount';
  await ctx.answerCbQuery();
  await ctx.editMessageText('✏️ Введите минимальную сумму чека (в рублях):', backToAdmin);
}

async function requestEditMaxAgeDays(ctx) {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('🚫 Доступ запрещён');
  ctx.session.awaitingDrawSetting = 'maxAgeDays';
  await ctx.answerCbQuery();
  await ctx.editMessageText('✏️ Введите максимальный возраст чека (в днях, 0 = без ограничения):', backToAdmin);
}

async function handleDrawSettingInput(ctx) {
  if (!isAdmin(ctx)) return;
  if (!ctx.session?.awaitingDrawSetting) return;

  const key = ctx.session.awaitingDrawSetting;
  let value = ctx.message.text.trim();

  try {
    if (key === 'maxAgeDays') {
      if (value === '0' || value === '' || value.toLowerCase() === 'null') {
        value = null;
      } else {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) {
          throw new Error('Актуальность должна быть целым неотрицательным числом');
        }
        value = num;
      }
    } else if (key === 'minAmount') {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        throw new Error('Мин. сумма должна быть положительным числом');
      }
      value = num;
    }

    await updateDrawSetting(key, value);
    await ctx.reply('✅ Настройка обновлена!', backToAdmin);
    delete ctx.session.awaitingDrawSetting;
  } catch (e) {
    await ctx.reply(`❌ ${e.message}`, backToAdmin);
  }
}

// Обновите handleDrawSettingInput, чтобы поддерживать maxWinners:
async function handleDrawSettingInput(ctx) {
  if (!isAdmin(ctx)) return;
  if (!ctx.session?.awaitingDrawSetting) return;

  const key = ctx.session.awaitingDrawSetting;
  let value = ctx.message.text.trim();

  try {
    if (key === 'maxAgeDays') {
      if (value === '0' || value === '' || value.toLowerCase() === 'null') {
        value = null;
      } else {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) {
          throw new Error('Актуальность должна быть целым неотрицательным числом');
        }
        value = num;
      }
    } else if (key === 'minAmount' || key === 'maxWinners') { // ← добавлено maxWinners
      const num = Number(value);
      if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        throw new Error('Значение должно быть целым положительным числом');
      }
      value = num;
    }

    await updateDrawSetting(key, value);
    await ctx.reply('✅ Настройка обновлена!', backToAdmin);
    delete ctx.session.awaitingDrawSetting;
  } catch (e) {
    await ctx.reply(`❌ ${e.message}`, backToAdmin);
  }
}


function handleAdminAction(action) {
  return async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.answerCbQuery('🚫 Доступ запрещён');
    }

    try {
      if (action === 'export') {
        await ctx.answerCbQuery('📤 Готовим выгрузку...');
        const filePath = await exportData();
        await ctx.replyWithDocument({ source: filePath });
        require('fs').unlink(filePath, () => { });
        await ctx.reply('✅ Выгрузка отправлена.', backToAdmin);
      } else if (action === 'draw') {
        await ctx.answerCbQuery('🎯 Запускаем розыгрыш...');
        const result = await runDraw();
        if (result.success) {
          const winnerList = result.winners.map(w => {
            const id = w.telegramId;
            const username = w.username ? `@${w.username}` : '—';
            return `• <b>${id}</b> (${username})`;
          }).join('\n');

          const message = `
🎉 <b>Розыгрыш завершён!</b>

🏆 <b>Победители (${result.totalWinners}):</b>
${winnerList}

🎟️ <b>Всего участников:</b> ${result.totalParticipants}
    `.trim();

          await ctx.reply(message, { parse_mode: 'HTML', ...backToAdmin });
        } else {
          await ctx.reply(result.message, backToAdmin);
        }
      }
    } catch (e) {
      console.error(e);
      await ctx.answerCbQuery('❌ Ошибка выполнения');
      await ctx.reply('❌ Произошла ошибка.', backToAdmin);
    }
  };
}

module.exports = {
  adminStart,
  handleEdit_texts,
  handleSetTextCommand,
  handleAdminAction,
  showDrawSettings,
  toggleDrawEnabled,
  requestEditMinAmount,
  requestEditMaxAgeDays,
  handleDrawSettingInput,
  requestEditMaxWinners,
};