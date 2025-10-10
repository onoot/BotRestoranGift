// src/services/receiptService.js
const fs = require('fs-extra');
const path = require('path');
const { Receipt } = require('../db/database'); // ← только Receipt, User не нужен
const { RECEIPTS_DIR } = require('../config/paths');

async function saveReceipt(telegramId, photoPath, orderId, amount) {
  // Убедитесь, что telegramId передан
  if (!telegramId) {
    throw new Error('telegramId is required');
  }

  const fileName = `${Date.now()}_${telegramId}.jpg`;
  const destPath = path.join(RECEIPTS_DIR, fileName);
  await fs.move(photoPath, destPath, { overwrite: true });

  return await Receipt.create({
    telegramId: telegramId, // ← ОБЯЗАТЕЛЬНО!
    orderId: orderId,
    amount: parseFloat(amount),
    filePath: destPath,
    confirmed: false,
  });
}

module.exports = { saveReceipt };