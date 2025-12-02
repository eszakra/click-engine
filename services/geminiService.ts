import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailSpec } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateThumbnailConcept = async (videoIdea: string): Promise<ThumbnailSpec | null> => {
  const client = getClient();
  if (!client) return null;

  const model = "gemini-2.5-flash";
  const prompt = `
    Act as a world-class YouTube strategist and avant-garde designer.
    Analyze this video idea: "${videoIdea}".
    Create a viral thumbnail specification.
    Be bold, high-contrast, and psychologically manipulative (in a good way) for CTR.
    Return the result as JSON.
  `;

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A short, punchy text overlay for the thumbnail (max 5 words)" },
            primaryEmotion: { type: Type.STRING, description: "The dominant emotion: Shock, Curiosity, Fear, Joy" },
            colorPalette: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Hex codes for 3 dominant colors" 
            },
            composition: { type: Type.STRING, description: "Description of the layout (e.g., Rule of thirds, Center focused)" },
            ctrEstimate: { type: Type.NUMBER, description: "Estimated CTR percentage (e.g. 12.5)" },
            foregroundElement: { type: Type.STRING, description: "The main subject description" },
            backgroundElement: { type: Type.STRING, description: "The background description" }
          },
          required: ["title", "primaryEmotion", "colorPalette", "composition", "ctrEstimate", "foregroundElement", "backgroundElement"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText) as ThumbnailSpec;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};