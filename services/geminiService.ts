import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent } from "../types";

export type PostLength = 'Short' | 'Thoughtful';

export const DEFAULT_SYSTEM_INSTRUCTION = `
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
- Think: “How would I say this if I had 10 more minutes to explain it clearly?”`;

// --- СПИСОК СЛУЧАЙНЫХ УГЛОВ ДЛЯ РЕГЕНЕРАЦИИ ---
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

const Prompts = {
  // Генерация первого варианта
  generatePost: (rawInput: string, length: PostLength) => {
    let lengthInstruction = "";
    switch (length) {
        case 'Short':
            lengthInstruction = `"MODE: SHORT & PUNCHY. Make it concise without losing main idea of the post"`;
            break;
        case 'Thoughtful':
             lengthInstruction = `MODE: THOUGHTFUL STORYTELLING
             - The input notes are just a SEED. You MUST grow them into a full post.
             - STRUCTURE: 
               1. The Struggle (Start with the context/problem implied in notes).
               2. The Realization (Why does this matter?).
               3. The Solution (The core update from notes).
             - Aim for 3-4 short paragraphs.`;
            break;
    }
    return `Take these raw notes and turn them into a personal LinkedIn post.
    
    === INPUT NOTES ===
    INPUT NOTES: "${rawInput}"

    === INSTRUCTIONS ===
    ${lengthInstruction}

    === GENERAL STYLE ===
    No solid wall of text.
    Use short paragraphs with air (white space).
    Each line ≈ 3–10 words on average.
    Avoid "broetry" (2-word lines).
    Readable, calm, human pacing.
    
    Return JSON only.`
  },

  // --- РЕГЕНЕРАЦИЯ ---
  regenerateText: (rawInput: string, length: PostLength, dynamicInstruction: string) => {
    let lengthInstruction = "";
    switch (length) {
        case 'Short':
            lengthInstruction = `MODE: SHORT & PUNCHY. Make it concise without losing main idea of the post`;
            break;
        case 'Thoughtful':
             lengthInstruction = ` MODE: THOUGHTFUL STORYTELLING
             - The input notes are just a SEED. You MUST grow them into a full post.
             - STRUCTURE: 
               1. The Struggle (Start with the context/problem implied in notes).
               2. The Realization (Why does this matter?).
               3. The Solution (The core update from notes).
             - Aim for 3-4 short paragraphs.`;
            break;
    }

    return `ACT AS A GHOSTWRITER.
    You are rewriting a LinkedIn post from scratch.
    
    >>> NEW ANGLE: ${dynamicInstruction} <<<
    
    === INPUT NOTES ===
    "${rawInput}"
    
    === LENGTH INSTRUCTIONS ===
    ${lengthInstruction}
    
    Return JSON with property "postText".`;
  },

  // --- ВИЗУАЛКА ---
  regenerateVisuals: (rawInput: string, angle: string) =>
    `Generate a catchy headline and subheadline for a visual card based on these notes.
    Style: ${angle}.
    Headline: Short & Punchy (max 7 words).
    Sub-headline: Supporting context.
    
    Notes: ${rawInput}`,

  regenerateHeadlineOnly: (rawInput: string, angle: string) =>
    `Generate a NEW, different personal headline based on these notes.
    Style constraint: ${angle}.
    Max 7 words. Return JSON with property "text".
    Context: ${rawInput}`,

  regenerateSubHeadlineOnly: (rawInput: string, angle: string) =>
    `Generate ONE new subheadline (max 10 words).
    Style constraint: ${angle}.
    It should explain the idea or add a layer of intrigue.
    Return JSON with property "text".
    Context: ${rawInput}`,
};

const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || "";
let ai: any = null;

try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey: apiKey });
    } else {
        console.warn("API Key is missing!");
    }
} catch (e) {
    console.error("Failed to initialize Gemini Client", e);
}

const MODEL_NAME = "gemini-2.0-flash-exp";

// --- ХЕЛПЕР ДЛЯ ЧИСТКИ JSON (Чтобы не повторять код) ---
const parseCleanJSON = (text: string) => {
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
        const cleanJson = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("JSON Parse Error. Raw text:", text);
        throw e;
    }
};

// --- ФУНКЦИИ ГЕНЕРАЦИИ ---

export const generateLinkedInPost = async (rawInput: string, length: PostLength = 'Thoughtful', customInstruction?: string): Promise<GeneratedContent> => {
  if (!ai) return { postText: "System Error: API Key missing", headline: "Error", subHeadline: "No API Key" };
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: Prompts.generatePost(rawInput, length), 
      config: {
        systemInstruction: customInstruction || DEFAULT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            postText: { type: Type.STRING },
            headline: { type: Type.STRING },
            subHeadline: { type: Type.STRING },
          },
          required: ["postText", "headline", "subHeadline"],
        },
      },
    });
    
    const text = response.text || "";
    return parseCleanJSON(text) as GeneratedContent;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { postText: "Error generating post", headline: "Error", subHeadline: "Try again" };
  }
};

export const regeneratePostText = async (rawInput: string, currentPost: string, length: PostLength, customInstruction?: string): Promise<string> => {
  if (!ai) return currentPost;

  const randomAngle = REGENERATE_ANGLES[Math.floor(Math.random() * REGENERATE_ANGLES.length)];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: Prompts.regenerateText(rawInput, length, randomAngle), 
      config: {
        systemInstruction: customInstruction || DEFAULT_SYSTEM_INSTRUCTION,
        temperature: 1.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { postText: { type: Type.STRING } },
          required: ["postText"],
        },
      },
    });

    const text = response.text || "";
    const json = parseCleanJSON(text); // Теперь безопасно
    return json.postText;
  } catch (error) {
    console.error("Regenerate Text Error:", error);
    return currentPost;
  }
};

export const regenerateVisualField = async (rawInput: string, field: 'headline' | 'subHeadline'): Promise<string> => {
  if (!ai) return "Error";

  const randomVisualAngle = VISUAL_ANGLES[Math.floor(Math.random() * VISUAL_ANGLES.length)];

  try {
    const prompt = field === 'headline' 
        ? Prompts.regenerateHeadlineOnly(rawInput, randomVisualAngle)
        : Prompts.regenerateSubHeadlineOnly(rawInput);
        
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 1.1, 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: { text: { type: Type.STRING } },
            required: ["text"],
        },
      },
    });
    
    const text = response.text || "";
    const json = parseCleanJSON(text); // Теперь безопасно
    return json.text;
  } catch (error) {
    console.error(`Regenerate ${field} Error:`, error);
    return "Try again";
  }
};