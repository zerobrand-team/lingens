import { GoogleGenerativeAI } from "@google/generative-ai";

// === 1. ВАШИ СЕКРЕТНЫЕ ИНСТРУКЦИИ ===
const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You translate my thoughts into English LinkedIn posts. Your main goal is clarity and structure without changing my voice.
This should feel like I’m speaking, just clearer and more readable.

### LANGUAGE & TONE RULES
- Use simple, conversational English.
- Natural rhythm, slightly informal.
- NO corporate language.
- NO motivational clichés.
- Write like a real person explaining something out loud to a friend.

### FIDELITY TO MY WORDS
- Stay as close as possible to my original wording and intent.
- Do NOT replace my ideas with “better” ones.
`;

const REGENERATE_ANGLES = [
  "Focus heavily on the emotion and personal struggle.",
  "Make it punchy, direct, and slightly contrarian.",
  "Use a storytelling approach: start with a specific moment in time.",
  "Focus on the 'Lesson Learned' aspect, be very practical.",
  "Make it sound like a quick observation made on the go (casual vibe).",
  "Highlight the contrast between expectation vs reality."
];

const VISUAL_ANGLES = ["Provocative & Bold", "Minimalist & Mysterious", "Direct & Value-driven", "Emotional & Personal"];

export default async function handler(request, response) {
  // Разрешаем CORS (чтобы работало с фронтенда)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing on server");

    const genAI = new GoogleGenerativeAI(apiKey);
    const { action, rawInput, length, field } = request.body;

    // Выбираем инструкцию
    let prompt = "";
    let systemInstruction = SYSTEM_INSTRUCTION; // Базовая инструкция

    if (action === 'generatePost') {
        const lengthText = length === 'Short' ? "Short & Punchy" : "Thoughtful Storytelling";
        prompt = `Task: Create a LinkedIn post. Input: "${rawInput}". Style: ${lengthText}. Return JSON only.`;
    } else if (action === 'regenerateText') {
        const angle = REGENERATE_ANGLES[Math.floor(Math.random() * REGENERATE_ANGLES.length)];
        prompt = `Rewrite this post with a new angle: ${angle}. Input: "${rawInput}". Return JSON.`;
    } else if (action === 'regenerateVisualField') {
         const angle = VISUAL_ANGLES[Math.floor(Math.random() * VISUAL_ANGLES.length)];
         prompt = `Generate a ${field} for this post. Style: ${angle}. Context: "${rawInput}". Return JSON.`;
    }

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Или gemini-pro
        systemInstruction: systemInstruction 
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Чистим ответ от markdown json, если есть
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Пытаемся распарсить JSON, если модель вернула строку - заворачиваем в объект
    try {
        const jsonResponse = JSON.parse(cleanText);
        return response.status(200).json(jsonResponse);
    } catch (e) {
        // Если пришел просто текст (бывает при ошибках модели), отдаем как есть
        return response.status(200).json({ postText: cleanText, text: cleanText });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
