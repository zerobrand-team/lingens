// api/generate.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// === 1. ПОЛНАЯ СИСТЕМНАЯ ИНСТРУКЦИЯ ===
const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You translate my thoughts into English LinkedIn posts. Your main goal is clarity and structure without changing my voice.
This should feel like I’m speaking, just clearer and more readable.

### LANGUAGE & TONE RULES
- Use simple, conversational English.
- Natural rhythm, slightly informal.
- **NO** corporate language.
- **NO** motivational clichés or “thought leadership” phrases.
- If something sounds too polished — simplify it.
- Write like a real person explaining something out loud to a friend.

### FIDELITY TO MY WORDS
- Stay as close as possible to my original wording and intent.
- Do NOT replace my ideas with “better” ones.
- Do NOT generalize or abstract unless necessary.
- Think: “How would I say this if I had 10 more minutes to explain it clearly?”
`;

const REGENERATE_ANGLES = [
  "Focus heavily on the emotion and personal struggle.",
  "Make it punchy, direct, and slightly contrarian.",
  "Use a storytelling approach: start with a specific moment in time.",
  "Focus on the 'Lesson Learned' aspect, be very practical.",
  "Make it sound like a quick observation made on the go (casual vibe).",
  "Highlight the contrast between expectation vs reality."
];

const VISUAL_ANGLES = [
  "Provocative & Bold", 
  "Minimalist & Mysterious", 
  "Direct & Value-driven", 
  "Emotional & Personal"
];

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return response.status(500).json({ error: "API Key missing" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const { action, rawInput, length, field } = request.body;

    // === 2. ВОССТАНОВЛЕНИЕ ЛОГИКИ ПРОМПТОВ ===
    let userPrompt = "";
    
    // Общие правила оформления (Восстановлено из старого кода)
    const styleRules = `
    === GENERAL STYLE RULES ===
    - No solid wall of text.
    - Use short paragraphs with air (white space).
    - Each line ≈ 3–10 words on average.
    - Avoid "broetry" (2-word lines).
    - Readable, calm, human pacing.`;

    if (action === 'generatePost') {
        let lengthInstruction = "";
        if (length === 'Short') {
            lengthInstruction = `MODE: SHORT & PUNCHY. Make it concise without losing main idea of the post.`;
        } else {
            lengthInstruction = `MODE: THOUGHTFUL STORYTELLING
            - The input notes are just a SEED. You MUST grow them into a full post.
            - STRUCTURE: 
              1. The Struggle (Start with the context/problem implied in notes).
              2. The Realization (Why does this matter?).
              3. The Solution (The core update from notes).
            - Aim for 3-4 short paragraphs.`;
        }

        userPrompt = `
        Take these raw notes and turn them into a personal LinkedIn post.
        
        === INPUT NOTES ===
        "${rawInput}"

        === INSTRUCTIONS ===
        ${lengthInstruction}
        ${styleRules}

        CRITICAL: Return ONLY a raw JSON object:
        {
          "postText": "...",
          "headline": "Short punchy headline (max 7 words)",
          "subHeadline": "Supporting context (max 7 words)"
        }`;

    } else if (action === 'regenerateText') {
        const angle = REGENERATE_ANGLES[Math.floor(Math.random() * REGENERATE_ANGLES.length)];
        const lengthText = length === 'Short' ? "SHORT & PUNCHY" : "THOUGHTFUL STORYTELLING";
        
        userPrompt = `
        Take these raw notes and turn them into a personal LinkedIn post.
        
        ANGLE: ${angle} <<<
        MODE: ${lengthText}
        
        === INPUT NOTES ===
        "${rawInput}"
        
        ${styleRules}
        
        Return JSON with property "postText".`;

    } else if (action === 'regenerateVisualField') {
        const angle = VISUAL_ANGLES[Math.floor(Math.random() * VISUAL_ANGLES.length)];
        const isHeadline = field === 'headline';
        
        userPrompt = isHeadline 
          ? `Generate a NEW, different personal headline based on these notes.
             Style constraint: ${angle}. Max 7 words. 
             Context: ${rawInput}
             Return JSON: { "text": "..." }`
          : `Generate ONE new subheadline (max 10 words).
             Style constraint: ${angle}. It should explain the idea or add a layer of intrigue.
             Context: ${rawInput}
             Return JSON: { "text": "..." }`;
    }

    // Модель 2.0 Flash (как в вашем первом коде)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp", 
        systemInstruction: SYSTEM_INSTRUCTION 
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    
    // Очистка от markdown-оберток
    const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const jsonResponse = JSON.parse(cleanJsonText);
        return response.status(200).json(jsonResponse);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return response.status(200).json({ 
            postText: cleanJsonText, 
            headline: "New Post", 
            subHeadline: "Read more" 
        });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
