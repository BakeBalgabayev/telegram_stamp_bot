import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { message } = req.body;

  if (!message || !message.text) {
    return res.status(200).send("No message content");
  }

  const chatId = message.chat.id;
  const userText = message.text;

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
      "🤖 Нечего ответить";

    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: reply,
      }
    );

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    return res.status(500).send("Internal Error");
  }
}
