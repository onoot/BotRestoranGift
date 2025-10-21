//src\bot\keyboards\keyboards.js
const { Markup } = require('telegraf');

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('📤 Загрузить чек', 'upload_receipt')],
  // [Markup.button.callback('ℹ️ О боте', 'info_bot')],
  [Markup.button.callback('📜 Публичная оферта', 'public_offer')],
  [Markup.button.callback('🎁 О розыгрыше', 'draw_info')],
]);

const adminMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🔤 Тексты', 'edit_texts')],
  [Markup.button.callback('⚙️ Настройки розыгрыша', 'draw_settings')],
  [Markup.button.callback('📊 Выгрузить Excel', 'admin_export')],
  [Markup.button.callback('🎯 Запустить розыгрыш', 'admin_run_draw')],
  [Markup.button.callback('🏠 В главное меню', 'back_to_main')],
]);

const backToAdmin = Markup.inlineKeyboard([
  [Markup.button.callback('🔙 В админку', 'back_to_admin')],
]);

const backToMain = Markup.inlineKeyboard([
  [Markup.button.callback('🏠 В главное меню', 'back_to_main')],
]);

const cencel = Markup.inlineKeyboard([
  [Markup.button.callback('🏠 В главное меню', 'back_cancel_to_main')],
]);

const confirmReceipt = Markup.inlineKeyboard([
  Markup.button.callback('✅ Подтвердить', 'confirm_receipt'),
  Markup.button.callback('❌ Отменить', 'cancel_receipt'),
]);

const checkSubcs = Markup.inlineKeyboard([
  Markup.button.callback('✅ Я подписан(а)', 'check_subscription'),
  Markup.button.url('📣Подписаться', 'https://vk.ru/yalta_izh'),
]);

// Упрощённое меню настроек — без "статичных" кнопок
const drawSettingsMenu = (settings) => Markup.inlineKeyboard([
  [Markup.button.callback(`Мин. сумма: ${settings.minAmount} ₽`, 'noop')],
  [Markup.button.callback('✏️ Изменить', 'edit_minAmount')],
  [Markup.button.callback(`Актуальность: ${settings.maxAgeDays ? `${settings.maxAgeDays} дн.` : '∞'}`, 'noop')],
  [Markup.button.callback('✏️ Изменить', 'edit_maxAgeDays')],
  [Markup.button.callback(`Победителей: ${settings.maxWinners}`, 'noop')],
  [Markup.button.callback('✏️ Изменить', 'edit_maxWinners')], 
  [Markup.button.callback(`Включён: ${settings.enabled ? '✅' : '❌'}`, 'toggle_enabled')],
  [Markup.button.callback('🔙 Назад', 'back_to_admin')],
]);

// Заглушка для "статичных" кнопок
const noop = () => {};

module.exports = {
  mainMenu,
  adminMenu,
  backToAdmin,
  backToMain,
  confirmReceipt,
  drawSettingsMenu,
  noop,
  checkSubcs,
  cencel
};