export interface GeneratedContent {
  postText: string;
  headline: string;
  subHeadline: string;
}

export type PostLength = 'Short' | 'Thoughtful';

const callApi = async (payload: any) => {
  try {
    const response = await fetch('/api/generate', { // Стучимся в наш файл generate.ts
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Server error');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const generateLinkedInPost = async (rawInput: string, length: PostLength = 'Thoughtful'): Promise<GeneratedContent> => {
  const data = await callApi({ 
    action: 'generatePost', 
    rawInput, 
    length 
  });
  
  return data || { postText: "Error", headline: "Error", subHeadline: "Error" };
};

export const regeneratePostText = async (rawInput: string, currentPost: string, length: PostLength): Promise<string> => {
  const data = await callApi({ 
    action: 'regenerateText', 
    rawInput, 
    length 
  });
  return data?.postText || currentPost;
};

export const regenerateVisualField = async (rawInput: string, field: 'headline' | 'subHeadline'): Promise<string> => {
  const data = await callApi({ 
    action: 'regenerateVisualField', 
    rawInput, 
    field 
  });
  return data?.text || "Try again";
};
