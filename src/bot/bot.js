const { Telegraf, session, Scenes } = require('telegraf');
const { BOT_TOKEN } = require('../config/botConfig');
const uploadScene = require('./scenes/uploadScene');

const { startHandler } = require('./handlers/userHandlers');
const {
  adminStart,
  handleEdit_texts,
  handleSetTextCommand,
  handleAdminAction,
  showDrawSettings,
  toggleDrawEnabled,
  requestEditMinAmount,
  requestEditMaxAgeDays,
  handleDrawSettingInput,
  requestEditMaxWinners
} = require('./handlers/adminHandlers');

const {
  infoHandler,
  offerHandler,
  drawInfoHandler,
  confirmReceiptHandler,
} = require('./handlers/userHandlers');

const {
  mainMenu,
  adminMenu,
  backToMain,
  backToAdmin,
  confirmReceipt,
  noop,
} = require('./keyboards/keyboards');

const bot = new Telegraf(BOT_TOKEN);

const stage = new Scenes.Stage([uploadScene]);
bot.use(session());
bot.use(stage.middleware());

// Пользователь
bot.start(startHandler);
bot.action('upload_receipt', (ctx) => ctx.scene.enter('upload_scene'));
bot.action('info_bot', infoHandler);
bot.action('public_offer', offerHandler);
bot.action('draw_info', drawInfoHandler);
bot.action(['confirm_receipt', 'cancel_receipt'], confirmReceiptHandler);

// Админка
bot.command('admin', adminStart);
bot.command('set_text', handleSetTextCommand);

// Настройки розыгрыша
bot.action('draw_settings', showDrawSettings);
bot.action('edit_minAmount', requestEditMinAmount);
bot.action('edit_maxAgeDays', requestEditMaxAgeDays);
bot.action('toggle_enabled', toggleDrawEnabled);
bot.action('edit_maxWinners', requestEditMaxWinners); 
bot.action('noop', (ctx) => ctx.answerCbQuery()); 

// Остальные действия
bot.action('edit_texts', handleEdit_texts);
bot.action('admin_export', handleAdminAction('export'));
bot.action('admin_run_draw', handleAdminAction('draw'));
bot.action('back_to_main', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText('Главное меню:', mainMenu);
});
bot.action('back_to_admin', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('🚫 Доступ запрещён');
  ctx.answerCbQuery();
  ctx.editMessageText('🔐 Панель администратора:', adminMenu);
});

// Обработка текста
bot.on('text', async (ctx) => {
  if (ctx.session?.awaitingDrawSetting) {
    return handleDrawSettingInput(ctx);
  }
});

function isAdmin(ctx) {
  const { ADMIN_IDS } = require('../config/botConfig');
  return ADMIN_IDS.includes(ctx.from.id);
}

module.exports = bot;