export interface GeneratedContent {
  postText: string;
  headline: string;
  subHeadline: string;
}

export type PostLength = 'Short' | 'Thoughtful';

const callApi = async (payload: any) => {
  try {
    const response = await fetch('/api/generate', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error("API Request Failed:", error);
    throw error; 
  }
};

export const generateLinkedInPost = async (rawInput: string, length: PostLength = 'Thoughtful'): Promise<GeneratedContent> => {
  return await callApi({ 
    action: 'generatePost', 
    rawInput, 
    length 
  });
};

export const regeneratePostText = async (rawInput: string, currentPost: string, length: PostLength): Promise<string> => {
  
  const data = await callApi({ 
    action: 'regenerateText', 
    rawInput: rawInput,
    length 
  });
  return data.postText;
};

export const regenerateVisualField = async (rawInput: string, field: 'headline' | 'subHeadline'): Promise<string> => {
  const data = await callApi({ 
    action: 'regenerateVisualField', 
    rawInput, 
    field 
  });
  
  return data.text || data.headline || data.subHeadline || "Try again";
};
