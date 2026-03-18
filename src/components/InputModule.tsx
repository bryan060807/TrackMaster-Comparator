import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface InputModuleProps {
  track: 'A' | 'B';
  fileName: string | undefined;
  onFileSelect: (file: File) => void;
  nudgeValue?: number;
  onNudgeChange?: (val: number) => void;
}

export const InputModule: React.FC<InputModuleProps> = ({ track, fileName, onFileSelect, nudgeValue, onNudgeChange }) => {
  // Handle dragging files over the module
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle dropping files onto the module
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">
          CH {track} {track === 'A' ? 'Calibration' : 'Alignment'}
        </span>
      </div>
      
      {/* Drag and Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative group transition-all duration-300"
      >
        <div className={`bg-zinc-950 border border-zinc-800 p-3 flex justify-between items-center group-hover:border-zinc-500 transition-colors shadow-inner`}>
          <span className={`text-[10px] font-mono truncate max-w-[140px] ${track === 'A' ? 'text-amber-500' : 'text-emerald-500'}`}>
            {fileName || 'SIGNAL LOST...'}
          </span>
          
          <label className="cursor-pointer text-zinc-600 hover:text-zinc-200 transition-colors">
            <Search size={14} />
            <input 
              type="file" 
              className="hidden" 
              accept="audio/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onFileSelect(e.target.files[0]);
                }
              }} 
            />
          </label>
        </div>
      </div>

      {/* Phase Nudge Controls (Channel B Only) */}
      {track === 'B' && onNudgeChange !== undefined && (
        <div className="flex items-center justify-between bg-zinc-900/30 p-2 border border-zinc-800 rounded-sm">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">Phase Nudge</span>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNudgeChange(nudgeValue! - 1)} 
              className="text-zinc-600 hover:text-emerald-500 transition-colors active:translate-y-px"
            >
              <ChevronLeft size={16}/>
            </button>
            <span className="text-emerald-500 font-mono text-[10px] w-10 text-center bg-black/50 py-0.5 rounded border border-zinc-800/50">
              {nudgeValue}ms
            </span>
            <button 
              onClick={() => onNudgeChange(nudgeValue! + 1)} 
              className="text-zinc-600 hover:text-emerald-500 transition-colors active:translate-y-px"
            >
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};