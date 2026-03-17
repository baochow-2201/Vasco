import Fuse from "fuse.js";
import fs from "fs";
import path from "path";

const faqPath = path.resolve("./data/faq.json");
const faqData = JSON.parse(fs.readFileSync(faqPath, "utf-8"));

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const normalizedFAQ = faqData.map(item => ({
  original: item.question,
  question: normalizeText(item.question),
  answer: item.answer
}));

// ---- Cực kỳ quan trọng ----
// giảm threshold để tránh match nhầm
const fuse = new Fuse(normalizedFAQ, {
  keys: ["question"],
  threshold: 0.35,
  ignoreLocation: true,
});

export function getFAQDebug(userMsg) {
  const text = normalizeText(userMsg);
  const result = fuse.search(text);

  if (!result.length) {
    return { match: false, score: null, answer: null, question: null };
  }

  const top = result[0];

  // ---- 1. score phải đủ thấp ----
  if (top.score > 0.30) {
    return { match: false, score: top.score, question: top.item.original };
  }

  // ---- 2. Câu FAQ phải có ít nhất 3 từ → tránh match câu quá ngắn ----
  if (top.item.question.split(" ").length < 3) {
    return { match: false, score: top.score, question: top.item.original };
  }

  return {
    match: true,
    score: top.score,
    question: top.item.original,
    answer: top.item.answer
  };
}

export function getFAQReply(message) {
  const r = getFAQDebug(message);
  return r.match ? r.answer : null;
}
