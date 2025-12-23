
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageType, Persona, PERSONAS } from './types';
import { gemini } from './services/geminiService';
import VoicePlayer from './components/VoicePlayer';
import VoiceCall from './components/VoiceCall';

const App: React.FC = () => {
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'aura': [{ id: '1', sender: 'aura', content: '今天的天气让我想起了我们第一次见面的时候，那时候的阳光也像现在这样温柔。', type: MessageType.TEXT, timestamp: Date.now() }],
    'luna': [{ id: '1', sender: 'aura', content: '我在听肖邦。有些音符只有在深夜里听，才能触碰到灵魂的褶皱。你呢，在忙什么？', type: MessageType.TEXT, timestamp: Date.now() }],
    'maya': [{ id: '1', sender: 'aura', content: '刚刚刷到一个超级酷的滑板视频！等下我们也去试试那条下坡路吧？', type: MessageType.TEXT, timestamp: Date.now() }]
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = messages[currentPersona.id];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, currentPersona]);

  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: text,
      type: MessageType.TEXT,
      timestamp: Date.now()
    };

    setMessages(prev => ({ ...prev, [currentPersona.id]: [...prev[currentPersona.id], userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      const history = currentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.type === MessageType.IMAGE ? "[一张自拍]" : msg.content }]
      }));
      history.push({ role: 'user', parts: [{ text }] });

      const responseText = await gemini.generateChatResponse(history, currentPersona);
      
      let processedText = responseText;
      let audioData: string | undefined;
      let imageData: string | undefined;

      // 检查图片请求
      if (processedText.includes('[PHOTO_REQUEST]')) {
        const desc = processedText.split('[PHOTO_REQUEST]')[1]?.trim() || "a selfie";
        imageData = await gemini.generateImage(desc, currentPersona) || undefined;
        processedText = processedText.replace('[PHOTO_REQUEST]', '').trim();
      }

      // 检查语音请求
      if (processedText.includes('[VOICE_REQUEST]')) {
        const speakText = processedText.replace('[VOICE_REQUEST]', '').trim();
        audioData = await gemini.generateSpeech(speakText) || undefined;
        processedText = speakText;
      }

      const auraMessage: Message = {
        id: Date.now().toString() + "-ai",
        sender: 'aura',
        content: imageData || (processedText || "（林汐温柔地看着你，没有说话）"),
        type: imageData ? MessageType.IMAGE : MessageType.TEXT,
        timestamp: Date.now(),
        audioData
      };

      setMessages(prev => ({ ...prev, [currentPersona.id]: [...prev[currentPersona.id], auraMessage] }));
    } catch (err) {
      console.error("Chat handling error:", err);
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        sender: 'aura',
        content: "刚才断网了一下，但我还在呢。刚才说到哪了？",
        type: MessageType.TEXT,
        timestamp: Date.now()
      };
      setMessages(prev => ({ ...prev, [currentPersona.id]: [...prev[currentPersona.id], errorMessage] }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans`}>
      {/* 侧边导航 */}
      <nav className="w-24 bg-black/60 border-r border-white/5 flex flex-col items-center py-10 gap-10 z-20">
        {PERSONAS.map(p => (
          <button
            key={p.id}
            onClick={() => setCurrentPersona(p)}
            className={`relative p-1 rounded-full transition-all duration-500 ${currentPersona.id === p.id ? 'ring-2 ring-white scale-110' : 'opacity-30 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'}`}
          >
            <img src={p.avatar} alt={p.name} className="w-14 h-14 rounded-full object-cover shadow-2xl" />
          </button>
        ))}
      </nav>

      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_30%_20%,_#1e293b_0%,_#020617_100%)]">
        {isCalling && <VoiceCall persona={currentPersona} onClose={() => setIsCalling(false)} />}

        <header className="h-20 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-10 border-b border-white/5 z-10 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer">
              <img src={currentPersona.avatar} className="w-12 h-12 rounded-full border border-white/10 object-cover" alt="Avatar" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse group-hover:bg-emerald-500/40 transition-all"></div>
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight text-white">{currentPersona.name}</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-emerald-500/80 uppercase tracking-widest font-bold">Online</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
             <button 
                onClick={() => setIsCalling(true)}
                className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10 shadow-lg active:scale-90"
              >
                <i className="fas fa-phone text-lg"></i>
             </button>
             <button className="text-white/20 hover:text-white transition-colors p-2"><i className="fas fa-ellipsis-h"></i></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 chat-scroll">
          <div className="max-w-4xl mx-auto space-y-10">
            {currentMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-5 group`}
              >
                {msg.sender === 'aura' && (
                  <img src={currentPersona.avatar} className="w-11 h-11 rounded-full border border-white/5 object-cover" alt="Avatar" />
                )}
                <div className={`flex flex-col gap-2.5 max-w-[75%]`}>
                  <div className={`px-6 py-4 rounded-3xl transition-all ${
                    msg.sender === 'user' 
                      ? 'bg-white text-black font-semibold shadow-[0_10px_30px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/5 backdrop-blur-md border border-white/10 text-slate-200'
                  }`}>
                    {msg.type === MessageType.IMAGE ? (
                      <div className="space-y-4">
                        <img src={msg.content} className="rounded-2xl w-full max-h-[500px] object-cover shadow-2xl brightness-90" alt="Selfie" />
                        <p className="text-[11px] text-white/40 text-center tracking-widest uppercase italic">Captured by {currentPersona.name}</p>
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed tracking-wide font-light">{msg.content}</p>
                    )}
                  </div>
                  {msg.audioData && (
                    <div className="mt-1">
                      <VoicePlayer base64Audio={msg.audioData} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                   <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-ping"></div>
                </div>
                <div className="text-[11px] text-white/30 tracking-[0.3em] uppercase animate-pulse">Thinking...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="p-8 bg-black/60 backdrop-blur-3xl border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="max-w-4xl mx-auto flex items-center gap-5"
          >
            <div className="flex-1 relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Talk to ${currentPersona.name.split(' ')[0]}...`}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-7 py-5 pr-16 focus:outline-none focus:border-white/20 transition-all text-sm text-white placeholder:text-white/20 shadow-inner"
              />
              <button 
                type="button"
                onClick={() => handleSendMessage("发张你现在的照片给我吧？")}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-all p-2"
              >
                <i className="fas fa-camera text-lg"></i>
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-white text-black w-16 h-16 rounded-2xl flex items-center justify-center hover:scale-105 disabled:opacity-10 disabled:scale-100 transition-all active:scale-95 shadow-2xl"
            >
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;
