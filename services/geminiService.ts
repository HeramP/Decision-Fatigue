import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateOptionsWithGemini = async (prompt: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 5 short, distinct options for the following decision topic: "${prompt}". 
      Keep options under 4 words each. Return strictly a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const result = JSON.parse(jsonText);
    if (Array.isArray(result)) {
      return result.slice(0, 6); // Limit to 6 max
    }
    return [];
  } catch (error) {
    console.error("Gemini generation error:", error);
    return ["Pizza", "Burgers", "Salad", "Sushi", "Tacos"]; // Fallback
  }
};
