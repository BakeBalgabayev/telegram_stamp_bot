require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Я Мадина, чем могу помочь ?');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text;

  if (userText.startsWith('/')) return;

  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: userText }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    bot.sendMessage(chatId, reply || "🤖 Нечего сказать.");
  } catch (error) {
    const err = error?.response?.data || error.message;
    console.error("Gemini API Error:", err);

    if (err.error?.code === 429) {
      bot.sendMessage(chatId, "⚠️ Превышен лимит запросов. Попробуй позже.");
    } else {
      bot.sendMessage(chatId, "⚠️ Ошибка при обращении ");
    }
  }
});
