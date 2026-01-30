// api/generate.js

// КОНСТАНТЫ И ИНСТРУКЦИИ ОСТАВЛЕНЫ БЕЗ ИЗМЕНЕНИЙ
const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
Your goal is to take my raw, messy thoughts and restructure them into a compelling narrative for LinkedIn in simple english. 
Write a personal reflection that feels immediate, honest, and easy to breathe in.
Your main goal is clarity and structure without changing my voice.

### LANGUAGE & TONE RULES
- Use simple, conversational English (the way people actually talk, not how they write articles).
- Natural rhythm, slightly informal.
- If it sounds too perfect or marketing-heavy, simplify it.
- Write like a real person explaining something out loud to a friend.
- Keep the sentences short and simple, with clear line breaks every 1–3 sentences to ensure the structure stays airy and readable.

### EDITING STRATEGY
- Keep my original intent.
- You MAY restructure, compress, or expand my thoughts if it improves clarity, rhythm, or LinkedIn readability.
- Do not break every single sentence into a new line.”
`;

const REGENERATE_ANGLES = [
  "Write from a first-person perspective: what I personally struggled with in this exact moment.",
  "Anchor the story in a concrete situation (time, place, context) — not a general feeling.",
  "Show the internal contradiction: what I believed before vs what reality forced me to accept.",
  "Focus on a small, specific realization — not a big abstract lesson.",
  "Keep it raw and slightly unfinished, like a thought I had mid-day, not a polished insight.",
  "Make the takeaway subjective and limited: what worked (or failed) for me, not universal advice.",
  "Emphasize the cost of learning this lesson — emotional, time, money, or ego."
];

const VISUAL_ANGLES = [
  "Action-First: Start with the core result or a decisive move. Use a strong verb.", 
  "The Confession: Reveal a personal struggle, mistake, or 'behind-the-scenes' truth.", 
  "The Cold Observer: Present the most impactful data point or fact as an objective reality.", 
  "Contrarian Take: Lead with the part of the text that challenges common beliefs.", 
  "The Mirror: Focus on the specific symptom of the problem the reader is facing.", 
  "The Specific Gain: Lead with the exact number, time saved, or profit mentioned."
];

export default async function handler(request, response) {
  // Заголовки CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 1. ИЗМЕНЕНИЕ: Берем ключ OpenRouter (без VITE_)
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return response.status(500).json({ error: "API Key missing" });

    const { action, rawInput, length, field } = request.body;

    let userPrompt = "";
    
    // ЛОГИКА ПРОМПТОВ ОСТАВЛЕНА БЕЗ ИЗМЕНЕНИЙ
    const styleRules = `
    === GENERAL STYLE RULES ===
    - No solid wall of text.
    - Use natural sentence lengths (average 4–12 words).
    - Readable, calm, human pacing.`;

    if (action === 'generatePost') {
        let lengthInstruction = "";
        if (length === 'Short') {
            lengthInstruction = `MODE: BONE-DRY MINIMALISM. Deliver the core message in 2-3 concise paragraphs. Only the core insight.`;
        } else {
            lengthInstruction = `MODE: THOUGHTFUL STORYTELLING
            - The input notes are just a SEED. You MUST grow them into a full post.
            - STRUCTURE: 
              1. The Struggle (Start with the context/problem implied in notes).
              2. The Realization (Why does this matter?).
              3. The Solution (The core update from notes).
            - Use 4-6 very short paragraphs.
            - Don't generalize; keep it anchored in the specific situation from the notes.
            - Each paragraph must add new information or perspective.`;
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
          ? `Analyze the Context and find the "Anchor Detail" (the strongest number, specific insight, or bold statement). Then, wrap it into a headline using the ${angle} style.
             PRIORITY RULES:
             1. If there's a NUMBER or a SPECIFIC RESULT in the text, it MUST be the focus of the headline, regardless of the angle.
             2. NO colons (":") or "Topic: Hook" structures.
             3. Start directly with the hook. No "How to" or "Why you should".
             4. Max 7 words.

     Context: ${rawInput}
     Return JSON: { "text": "..." }`
          : `Generate ONE new subheadline (max 10 words).
             Style constraint: ${angle}. It should explain the idea or add a layer of intrigue.
             Context: ${rawInput}
             Return JSON: { "text": "..." }`;
    }

    // 2. ИЗМЕНЕНИЕ: Запрос к OpenRouter через fetch (вместо Google SDK)
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://lingens.zerobrand.xyz/", // Ваш домен
        "X-Title": "Lingens",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001", 
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: userPrompt } 
        ],
        temperature: 0.7
      })
    });

    if (!openRouterResponse.ok) {
        const errorData = await openRouterResponse.text();
        throw new Error(`OpenRouter API Error: ${openRouterResponse.status} - ${errorData}`);
    }

    const data = await openRouterResponse.json();
    const text = data.choices[0].message.content;
    
    // Очистка JSON (как у вас и было)
    const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const jsonResponse = JSON.parse(cleanJsonText);
        return response.status(200).json(jsonResponse);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        // Fallback если JSON сломался
        return response.status(200).json({ 
            postText: cleanJsonText, 
            headline: "Please, try again in a bit", 
            subHeadline: "Please, try again in a bit" 
        });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
