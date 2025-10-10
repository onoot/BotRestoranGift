// src/utils/excelExporter.js
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function exportToExcel(rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Чеки');

  // Заголовки (без колонки filePath — вместо неё будет изображение)
  worksheet.columns = [
    { header: 'Telegram ID', key: 'telegramId', width: 15 },
    { header: 'Номер заказа', key: 'orderId', width: 20 },
    { header: 'Сумма (руб)', key: 'amount', width: 15 },
    { header: 'Подтверждён', key: 'confirmed', width: 12 },
    { header: 'Дата загрузки', key: 'uploadedAt', width: 20 },
    { header: 'Чек', width: 30 }, // ← место под изображение
  ];

  worksheet.getRow(1).font = { bold: true };

  let currentRow = 2;

  for (const row of rows) {
    // Заполняем текстовые ячейки
    worksheet.getCell(`A${currentRow}`).value = row.telegramId;
    worksheet.getCell(`B${currentRow}`).value = row.orderId;
    worksheet.getCell(`C${currentRow}`).value = row.amount;
    worksheet.getCell(`D${currentRow}`).value = row.confirmed;
    worksheet.getCell(`E${currentRow}`).value = row.uploadedAt;

    // Встраиваем изображение, если файл существует
    if (row.filePath && fs.existsSync(row.filePath)) {
      try {
        const extension = path.extname(row.filePath).toLowerCase();
        const validExts = ['.jpg', '.jpeg', '.png'];
        if (!validExts.includes(extension)) {
          worksheet.getCell(`F${currentRow}`).value = 'Неподдерживаемый формат';
        } else {
          // Добавляем изображение в workbook
          const imageId = workbook.addImage({
            filename: row.filePath,
            extension: extension.replace('.', ''), // 'jpeg', 'png'
          });

          // Вставляем изображение в ячейку F (6-я колонка)
          // tl = top-left, br = bottom-right (в единицах Excel: col, row — 0-based для изображений)
          worksheet.addImage(imageId, {
            tl: { col: 5, row: currentRow - 1 },       // F1 = col:5, row:0
            br: { col: 6, row: currentRow - 1 + 6 },   // высота ~6 строк
            editAs: 'oneCell', // изображение привязано к ячейке
          });

          // Увеличиваем высоту строки для лучшего отображения
          worksheet.getRow(currentRow).height = 80;
        }
      } catch (err) {
        console.warn(`Не удалось вставить изображение: ${row.filePath}`, err.message);
        worksheet.getCell(`F${currentRow}`).value = 'Ошибка загрузки';
      }
    } else {
      worksheet.getCell(`F${currentRow}`).value = 'Файл не найден';
    }

    currentRow += 6; 
  }

  const fileName = `checks_with_images_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const filePath = path.join(__dirname, '..', 'storage', fileName);
  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

module.exports = { exportToExcel };