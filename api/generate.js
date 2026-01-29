// api/generate.js

// КОНСТАНТЫ И ИНСТРУКЦИИ ОСТАВЛЕНЫ БЕЗ ИЗМЕНЕНИЙ
const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You translate my thoughts into English LinkedIn posts. Your main goal is clarity and structure without changing my voice.
This should feel like I’m speaking, just clearer and more readable.

### LANGUAGE & TONE RULES
- Use simple, conversational English.
- Natural rhythm, slightly informal.
- If something sounds too polished — simplify it.
- Write like a real person explaining something out loud to a friend.
- Keep the sentences short and simple, with clear line breaks every 1–3 sentences to ensure the structure stays airy and readable.

### FIDELITY TO MY WORDS
- Stay as close as possible to my original wording and intent.
- Do NOT replace my ideas with “better” ones.
- Do NOT generalize or abstract unless necessary.”
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
  "Sharp Paradox (Belief vs Reality)", 
  "First-Person Moment (The Snapshot)", 
  "Specific Failure or Struggle", 
  "Bone-Dry Minimalist Statement",
  "The Uncomfortable Truth",
  "The 'Before vs After' Contrast"
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
    - Use short paragraphs with air (white space).
    - Each line ≈ 3–10 words on average.
    - Avoid "broetry" (2-word lines).
    - Readable, calm, human pacing.`;

    if (action === 'generatePost') {
        let lengthInstruction = "";
        if (length === 'Short') {
            lengthInstruction = `MODE: SHORT & PUNCHY. Make it concise without losing main idea of the post. The text should be short.`;
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
          ? `Generate a headline that feels like a 'Stop Sign'. Use a strong verb or a stark contrast. No generic business advice. Make it feel personal and immediate.
             Style constraint: ${angle}. Max 7 words. 
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
        "HTTP-Referer": "https://lingens.vercel.app", // Ваш домен
        "X-Title": "Lingens",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001", 
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION }, // Ваши системные инструкции
          { role: "user", content: userPrompt }            // Ваш промпт
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
            headline: "New Post", 
            subHeadline: "Read more" 
        });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
