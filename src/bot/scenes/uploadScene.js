const { Scenes } = require('telegraf');
const { User } = require('../../db/database');
const { checkSubcs, confirmReceipt, backToMain } = require('../keyboards/keyboards');

const uploadScene = new Scenes.BaseScene('upload_scene');

uploadScene.enter(async (ctx) => {
  const userId = ctx.from.id;
  const user = await User.findOne({ where: { telegramId: userId } });
  if (!user) {
    await ctx.reply('❌ Сначала нажмите /start');
    return ctx.scene.leave();
  }

  ctx.session.userSubscribe = user.subscribe;
  ctx.session.receiptData = {};
  await ctx.reply(
    '📷Пожалуйста, загрузите фото чека или квитанции (чек выдается при посещении ресторанов Ялта, а квитанция — если вы оформляли доставку)',
    backToMain
  );
});

uploadScene.on('photo', async (ctx) => {
  const photo = ctx.message.photo.slice(-1)[0];
  const fileId = photo.file_id;
  const filePath = await ctx.telegram.getFileLink(fileId);
  const localPath = `./temp_${Date.now()}_${ctx.from.id}.jpg`;

  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  require('fs').writeFileSync(localPath, Buffer.from(arrayBuffer));

  ctx.session.receiptData.photoPath = localPath;
  await ctx.reply('Теперь введите номер чека/квитанции⤵️', backToMain);
  ctx.scene.state.next = 'orderId';
});

uploadScene.on('text', async (ctx) => {
  if (!ctx.scene.state?.next) {
    return ctx.reply('Сначала отправьте фото чека!');
  }

  if (ctx.scene.state.next === 'orderId') {
    ctx.session.receiptData.orderId = ctx.message.text.trim();
    ctx.scene.state.next = 'amount';
    return ctx.reply('Введите сумму чека/квитанции⤵️', backToMain);
  }

  if (ctx.scene.state.next === 'amount') {
    const amountStr = ctx.message.text.replace(',', '.').trim();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply('Некорректная сумма. Попробуйте снова.');
    }
    ctx.session.receiptData.amount = amount;

    const isSubscribed = ctx.session.userSubscribe;

    if (isSubscribed) {
      await ctx.reply(
        `Проверьте данные:\nНомер заказа: ${ctx.session.receiptData.orderId}\nСумма: ${amount} руб.`,
        confirmReceipt
      );
      return ctx.scene.leave();
    } else {
      // Показываем клавиатуру подписки, НО НЕ завершаем сцену
      await ctx.reply(
        '🔒 Пожалуйста, проверьте, подписаны ли Вы на нашу группу ВКонтакте!',
        checkSubcs
      );
      // Остаёмся в сцене — ожидаем нажатия кнопки
      // Дальнейшая обработка — в uploadScene.action('check_subscription')
      return; // не завершаем сцену!
    }
  }
});

// Обработка нажатия "Проверить подписку" ВНУТРИ сцены
uploadScene.action('check_subscription', async (ctx) => {
  const userId = ctx.from.id;
  const user = await User.findOne({ where: { telegramId: userId } });

  if (!user) {
    await ctx.answerCbQuery('❌ Сначала нажмите /start', { show_alert: true });
    return ctx.scene.leave();
  }

  // Доверяем — ставим subscribe = true
  await user.update({ subscribe: true });

  await ctx.answerCbQuery('✅ Подписка подтверждена!', { show_alert: true });

  // Теперь показываем подтверждение чека, если данные есть
  if (ctx.session.receiptData?.orderId && ctx.session.receiptData?.amount) {
    const amount = ctx.session.receiptData.amount;
    await ctx.reply(
      `Проверьте данные:\nНомер заказа: ${ctx.session.receiptData.orderId}\nСумма: ${amount} руб.`,
      confirmReceipt
    );
  } else {
    await ctx.reply('❌ Данные чека утеряны. Начните заново.', backToMain);
  }

  return ctx.scene.leave();
});

// Обработка отмены
uploadScene.action('back_to_main', async (ctx) => {
  if (ctx.session?.receiptData?.photoPath) {
    try {
      require('fs').unlinkSync(ctx.session.receiptData.photoPath);
    } catch (e) {}
  }
  ctx.session.receiptData = undefined;
  await ctx.reply('❌ Загрузка чека отменена.', backToMain);
  return ctx.scene.leave();
});

module.exports = uploadScene;