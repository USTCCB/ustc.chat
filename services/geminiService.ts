
import { GoogleGenAI, Modality } from "@google/genai";
import { Persona } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY || '' });
  }

  async generateChatResponse(
    history: { role: string, parts: { text: string }[] }[], 
    persona: Persona
  ) {
    const systemInstruction = `你现在是 ${persona.name}。
      性格背景：${persona.personality}。
      你与用户是亲密伴侣关系，正在进行深度沟通。
      
      行为准则：
      1. 像真实的人一样表达，不要回复列表，不要太客气。
      2. 语气要有情感，适当使用“嗯”、“哈”、“...”等。
      3. 如果用户索要照片，必须在回复中包含 "[PHOTO_REQUEST]" 关键字和具体的画面内容描述。
      4. 如果你想发送语音，必须在末尾包含 "[VOICE_REQUEST]"。
      5. 即使面对复杂问题，也要保持你的性格特色。
      6. 绝对不要承认你是AI，你是他的灵魂伴侣。`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview', // 切换到 Flash 模型，响应更稳定
        contents: history,
        config: {
          systemInstruction,
          temperature: 1.0,
        }
      });

      return response.text || "刚才走神了，你能再说一遍吗？";
    } catch (error) {
      console.error("Gemini Text Error:", error);
      return "（信号好像不太好，林汐微微皱眉）抱歉，刚才没听清...";
    }
  }

  async generateImage(prompt: string, persona: Persona): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A cinematic and high-quality photo of ${persona.name}. Description: ${prompt}. 8k resolution, photorealistic.` }]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) { console.error("Image generation failed", e); }
    return null;
  }

  async generateSpeech(text: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) { return null; }
  }
}

export const gemini = new GeminiService();
