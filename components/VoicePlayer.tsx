
import React, { useState, useEffect, useRef } from 'react';

interface VoicePlayerProps {
  base64Audio: string;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ base64Audio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const playAudio = async () => {
    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const ctx = audioContextRef.current;
    const bytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    sourceRef.current = source;
    source.start(0);
    setIsPlaying(true);
  };

  return (
    <button 
      onClick={playAudio}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
        isPlaying ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
      }`}
    >
      <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
      <span>{isPlaying ? 'Playing...' : 'Voice Message'}</span>
    </button>
  );
};

export default VoicePlayer;
