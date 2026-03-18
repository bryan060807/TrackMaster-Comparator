import React from 'react';
import { Play, Pause, Repeat, Activity } from 'lucide-react';

interface TransportProps {
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isMono: boolean;
  onToggleMono: () => void;
  isLooping: boolean;
  onToggleLoop: () => void;
}

export const Transport: React.FC<TransportProps> = ({ currentTime, isPlaying, onTogglePlay, isMono, onToggleMono, isLooping, onToggleLoop }) => {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-between h-full">
      <div className="bg-black border-4 border-zinc-700 p-4 rounded shadow-[inset_0_0_20px_black] w-full text-center mb-6">
        <span className="font-mono text-4xl text-red-600 tabular-nums italic" style={{ textShadow: '0 0 10px rgba(220,38,38,0.5)' }}>
          {formatTime(currentTime)}
        </span>
      </div>

      <div className="flex items-center gap-10">
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={onToggleMono} 
            className={`p-4 rounded-full border-2 shadow-lg transition-all ${isMono ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-zinc-800 text-zinc-600 bg-zinc-900'}`}
          >
            <Activity size={24}/>
          </button>
          <span className="text-[9px] font-black uppercase opacity-40">Mono Check</span>
        </div>

        <button 
          onClick={onTogglePlay} 
          className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center text-black shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-b-8 border-zinc-400 active:border-b-0 active:translate-y-2 transition-all"
        >
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
        </button>

        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={onToggleLoop} 
            className={`p-4 rounded-full border-2 shadow-lg transition-all ${isLooping ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-zinc-800 text-zinc-600 bg-zinc-900'}`}
          >
            <Repeat size={24}/>
          </button>
          <span className="text-[9px] font-black uppercase opacity-40">Loop Mode</span>
        </div>
      </div>
    </div>
  );
};