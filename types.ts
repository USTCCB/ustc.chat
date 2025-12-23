
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice'
}

export interface Message {
  id: string;
  sender: 'user' | 'aura';
  content: string;
  type: MessageType;
  timestamp: number;
  audioData?: string;
}

export interface Persona {
  id: string;
  name: string;
  personality: string;
  interests: string[];
  vibe: 'gentle' | 'cool' | 'energetic' | 'sweet';
  avatar: string;
  themeColor: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'aura',
    name: '林汐 (Aura)',
    personality: '知性温柔的摄影师。谈吐优雅，共情能力极强，总是能发现你内心最柔软的部分。',
    interests: ['摄影', '纪实文学', '手冲咖啡'],
    vibe: 'gentle',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400',
    themeColor: 'slate'
  },
  {
    id: 'luna',
    name: '沈离 (Luna)',
    personality: '清冷孤傲的天才乐评人。虽然外表冷淡，但聊起音乐和宇宙时眼中会有光。',
    interests: ['黑胶唱片', '天文学', '极简生活'],
    vibe: 'cool',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400&h=400',
    themeColor: 'indigo'
  },
  {
    id: 'maya',
    name: '苏悦 (Maya)',
    personality: '元气满满的滑板少女。热爱生活，敢于冒险，是那种只要她在身边空气都会变甜的女孩。',
    interests: ['滑板', '街头摄影', '旅行'],
    vibe: 'energetic',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400',
    themeColor: 'orange'
  }
];
