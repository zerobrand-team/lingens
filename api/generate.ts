// api/generate.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// === 1. СЕКРЕТНЫЕ КОНСТАНТЫ И ИНСТРУКЦИИ ===
const MODEL_NAME = "gemini-2.0-flash-exp";

const DEFAULT_SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You translate my thoughts into English LinkedIn posts...
(Сюда вставьте ВЕСЬ ваш длинный текст инструкции из старого файла)
...Think: “How would I say this if I had 10 more minutes to explain it clearly?”`;

const REGENERATE_ANGLES = [
  "Focus heavily on the emotion and personal struggle.",
  "Make it punchy, direct, and slightly contrarian.",
  "Use a storytelling approach: start with a specific moment in time.",
  "Focus on the 'Lesson Learned' aspect, be very practical.",
  "Make it sound like a quick observation made on the go (casual vibe).",
  "Highlight the contrast between expectation vs reality."
];

const VISUAL_ANGLES = [
  "Provocative & Bold", "Minimalist & Mysterious", "Direct & Value-driven", "Emotional & Personal"
];

// === 2. ЛОГИКА ПРОМПТОВ (Перенесена с клиента) ===
const Prompts = {
  generatePost: (rawInput: string, length: string) => {
    let lengthInstruction = length === 'Short' 
      ? `"MODE: SHORT & PUNCHY. Make it concise without losing main idea"`
      : `MODE: THOUGHTFUL STORYTELLING... (весь текст для Thoughtful)`;

    return `Take these raw notes and turn them into a personal LinkedIn post.
    === INPUT NOTES ===
    "${rawInput}"
    === INSTRUCTIONS ===
    ${lengthInstruction}
    === GENERAL STYLE ===
    Return JSON only.`;
  },
  
  // Остальные генераторы промптов...
  regenerateVisuals: (rawInput: string, angle: string) => 
    `Generate a catchy headline... Style: ${angle}. Notes: ${rawInput}`
};

// === 3. ОБРАБОТЧИК ЗАПРОСОВ ===
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, rawInput, length, field, customInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API Key missing on server" });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: customInstruction || DEFAULT_SYSTEM_INSTRUCTION
    });

    let prompt = "";
    let responseSchema: any = null;

    // === 4. МАРШРУТИЗАЦИЯ ДЕЙСТВИЙ ===
    switch (action) {
      case 'generatePost':
        prompt = Prompts.generatePost(rawInput, length);
        responseSchema = {
          type: SchemaType.OBJECT,
          properties: {
            postText: { type: SchemaType.STRING },
            headline: { type: SchemaType.STRING },
            subHeadline: { type: SchemaType.STRING },
          },
          required: ["postText", "headline", "subHeadline"],
        };
        break;

      case 'regenerateText':
        // Логика выбора случайного угла теперь НА СЕРВЕРЕ
        const randomAngle = REGENERATE_ANGLES[Math.floor(Math.random() * REGENERATE_ANGLES.length)];
        prompt = `ACT AS A GHOSTWRITER... NEW ANGLE: ${randomAngle}. INPUT: ${rawInput}`;
        responseSchema = {
          type: SchemaType.OBJECT,
          properties: { postText: { type: SchemaType.STRING } },
          required: ["postText"],
        };
        break;

      case 'regenerateVisualField':
        const visualAngle = VISUAL_ANGLES[Math.floor(Math.random() * VISUAL_ANGLES.length)];
        prompt = `Generate NEW ${field} based on: ${rawInput}. Style: ${visualAngle}. Return JSON { "text": "..." }`;
        responseSchema = {
          type: SchemaType.OBJECT,
          properties: { text: { type: SchemaType.STRING } },
          required: ["text"],
        };
        break;
    }

    // === 5. ВЫЗОВ GEMINI ===
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const responseText = result.response.text();
    // Чистим JSON перед отправкой (на всякий случай)
    const cleanJson = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());

    return res.status(200).json(cleanJson);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Failed to generate content" });
  }
}
