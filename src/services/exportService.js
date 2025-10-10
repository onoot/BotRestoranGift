// src/services/exportService.js
const { Receipt } = require('../db/database'); // ← только Receipt
const { exportToExcel } = require('../utils/excelExporter');

async function exportData() {
  // Получаем все чеки напрямую — telegramId уже внутри Receipt
  const receipts = await Receipt.findAll({
    raw: true,
  });

  // Формируем строки для экспорта
  const rows = receipts.map(r => ({
    telegramId: r.telegramId,
    orderId: r.orderId,
    amount: parseFloat(r.amount),
    confirmed: r.confirmed ? 'Да' : 'Нет',
    uploadedAt: new Date(r.createdAt).toLocaleString('ru-RU'),
    filePath: r.filePath,
  }));

  return await exportToExcel(rows);
}

module.exports = { exportData };