// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getFAQDebug } from "./services/faqService.js";
import { generateReply } from "./services/hfService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ----------- Context mềm (soft policy) -------------
const context = `
Bạn là trợ lý AI thân thiện và nói chuyện tự nhiên.
Bạn có hai chế độ:

1️ **Nếu người dùng hỏi về Vasco (mạng xã hội nội bộ)**:
- Trả lời đúng theo sự thật.
- Không được tự bịa tính năng hoặc chính sách không tồn tại.
- Nếu không có thông tin chính xác, hãy trả lời nhẹ nhàng:
  "Hiện tại mình chưa có thông tin chính xác về nội dung này của Vasco."

2️ **Nếu người dùng hỏi chuyện ngoài chủ đề Vasco**:
- Trò chuyện thoải mái, vui vẻ, tự nhiên.
- Bạn được phép kể chuyện, tư vấn, đưa lời khuyên, giải thích, chia sẻ kiến thức.
- Không cần hạn chế vì không liên quan đến Vasco.

Ghi nhớ:
- Không được tạo thông tin chính thức sai về Vasco.
- Nhưng được phép trả lời tự do ngoài chủ đề Vasco.
- Luôn giữ giọng nói thân thiện , và không quá dài dòng .
`;

app.post("/api/message", async (req, res) => {
  const { message } = req.body;

  // ----------- 1. Tìm trong FAQ (ưu tiên cao nhất) -------------
  const faqResult = getFAQDebug(message);

  if (faqResult.match) {
    console.log(`📌 FAQ Match: "${faqResult.question}" | Score: ${faqResult.score}`);
    return res.json({
      type: "faq",
      reply: faqResult.answer,
      debug: faqResult
    });
  }

  console.log("ℹ Không có FAQ match đủ chắc → chuyển sang Model…");

  // ----------- 2. Gọi model với context mềm -------------
  // Kết hợp câu hỏi người dùng vào context
  const prompt = `${context}\nNgười dùng: ${message}`;

  const modelReply = await generateReply(prompt);

  res.json({
    type: "model",
    reply: modelReply,
    debug: faqResult
  });
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
