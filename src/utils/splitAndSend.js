// utils/splitAndSend.js
async function splitAndSend(ctx, text, extra) {
  const MAX_LENGTH = 4096;
  const parts = [];
  for (let i = 0; i < text.length; i += MAX_LENGTH) {
    parts.push(text.slice(i, i + MAX_LENGTH));
  }
  const sentMessages = [];
  for (const part of parts) {
    const msg = await ctx.reply(part, extra);
    sentMessages.push(msg.message_id);
  }
  // Возвращаем массив message_id для последующего удаления
  return sentMessages;
}

async function deleteMessages(ctx, messageIds) {
  
}

module.exports = { splitAndSend, deleteMessages };