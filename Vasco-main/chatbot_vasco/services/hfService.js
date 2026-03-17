import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;

export async function generateReply(message) {
  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HF_TOKEN}`
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct",
          messages: [{ role: "user", content: message }],
          max_tokens: 200,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("❌ HuggingFace Error:", data);
      return "❌ Lỗi kết nối model.";
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error("🔥 Lỗi gọi API:", err);
    return "❌ Server đang bận hoặc mất mạng.";
  }
}
