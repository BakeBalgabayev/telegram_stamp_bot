import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Метод не поддерживается");
  }

  const { message } = req.body;

  if (!message || !message.text) {
    return res.status(200).send("Нет текста в сообщении");
  }

  const chatId = message.chat.id;
  const userText = message.text;

  // Обработка команды /start на русском
  if (userText === "/start") {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: "Привет! Я Мадина, напиши мне любой вопрос, и я постараюсь помочь!",
      }
    );
    return res.status(200).send("Start OK");
  }

  // Gemini API URL (flash — быстрее и дешевле)
  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

  try {
    const geminiResponse = await axios.post(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: userText }],
          },
        ],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const reply =
      geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤖 Я не смог придумать ответ.";

    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: reply,
      }
    );

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Gemini API Error:", err.response?.data || err.message);
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: "⚠️ Ошибка при обращении. Попробуй позже.",
      }
    );
    return res.status(500).send("Internal Error");
  }
}
