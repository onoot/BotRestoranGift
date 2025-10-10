const { Scenes } = require('telegraf');

const uploadScene = new Scenes.BaseScene('upload_scene');

uploadScene.enter((ctx) => {
  ctx.session.receiptData = {};
  return ctx.reply('📸 Пожалуйста, отправьте фото чека.');
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
  await ctx.reply('🔢 Теперь введите номер заказа:');
  ctx.scene.state.next = 'orderId';
});

uploadScene.on('text', async (ctx) => {
  if (!ctx.scene.state?.next) {
    return ctx.reply('Сначала отправьте фото чека!');
  }

  if (ctx.scene.state.next === 'orderId') {
    ctx.session.receiptData.orderId = ctx.message.text.trim();
    ctx.scene.state.next = 'amount';
    return ctx.reply('💰 Введите сумму заказа (в рублях):');
  }

  if (ctx.scene.state.next === 'amount') {
    const amountStr = ctx.message.text.replace(',', '.').trim();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply('Некорректная сумма. Попробуйте снова.');
    }
    ctx.session.receiptData.amount = amount;

    await ctx.reply(
      `Проверьте данные:\nНомер заказа: ${ctx.session.receiptData.orderId}\nСумма: ${amount} руб.`,
      require('../keyboards/keyboards').confirmReceipt
    );
    return ctx.scene.leave();
  }
});

module.exports = uploadScene; // ← именно так!