
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Persona } from '../types';

interface VoiceCallProps {
  persona: Persona;
  onClose: () => void;
}

const VoiceCall: React.FC<VoiceCallProps> = ({ persona, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  };

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
    let stream: MediaStream | null = null;
    let inputCtx: AudioContext | null = null;

    const startCall = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        // 显式唤醒音频上下文
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { 
              voiceConfig: { 
                prebuiltVoiceConfig: { 
                  voiceName: persona.vibe === 'cool' ? 'Puck' : 'Kore' 
                } 
              } 
            },
            systemInstruction: `你是 ${persona.name}。性格：${persona.personality}。你正在与用户通话，保持自然、亲昵。你可以随时打断用户，也可以在用户说话时给予回应。`,
          },
          callbacks: {
            onopen: () => {
              setStatus('connected');
              if (!stream || !inputCtx) return;
              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
              };
              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (msg.serverContent?.modelTurn?.parts) {
                for (const part of msg.serverContent.modelTurn.parts) {
                  if (part.inlineData?.data && audioContextRef.current) {
                    const buffer = await decodeAudioData(decodeBase64(part.inlineData.data), audioContextRef.current);
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContextRef.current.destination);
                    const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                    source.start(startTime);
                    nextStartTimeRef.current = startTime + buffer.duration;
                    sourcesRef.current.add(source);
                    setIsSpeaking(true);
                    source.onended = () => {
                      sourcesRef.current.delete(source);
                      if (sourcesRef.current.size === 0) setIsSpeaking(false);
                    };
                  }
                }
              }
              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onclose: onClose,
            onerror: (e) => {
              console.error("Live API Error:", e);
              setStatus('error');
            },
          }
        });
        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Voice Call Init Error:", err);
        setStatus('error');
      }
    };

    startCall();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      inputCtx?.close();
      sessionRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="relative mb-16">
        <div className={`absolute inset-[-40px] rounded-full bg-${persona.themeColor}-500/20 animate-pulse ${isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-0'} transition-all duration-700`}></div>
        <div className={`absolute inset-[-20px] rounded-full bg-${persona.themeColor}-500/30 animate-ping ${isSpeaking ? 'opacity-100' : 'opacity-0'} transition-all`}></div>
        <img src={persona.avatar} className={`w-56 h-56 rounded-full border-4 border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative z-10 object-cover transition-transform duration-500 ${isSpeaking ? 'scale-105' : 'scale-100'}`} alt={persona.name} />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-[11px] font-bold text-white border border-white/10 tracking-widest shadow-xl uppercase">
          {status === 'connecting' ? 'Connecting...' : status === 'error' ? 'Connection Failed' : 'Live Call'}
        </div>
      </div>
      
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">{persona.name}</h2>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isSpeaking ? 'animate-bounce' : 'opacity-50'}`}></div>
          <p className="text-white/40 text-xs tracking-[0.4em] uppercase font-light">
            {isSpeaking ? 'Speaking...' : 'Listening...'}
          </p>
        </div>
      </div>

      <button 
        onClick={onClose} 
        className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl hover:bg-red-600 transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
      >
        <i className="fas fa-phone-slash"></i>
      </button>
    </div>
  );
};

export default VoiceCall;
