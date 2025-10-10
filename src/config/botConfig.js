require('dotenv').config();

const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS.split(',').map(id => Number(id.trim()))
  : [];

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_IDS,
};