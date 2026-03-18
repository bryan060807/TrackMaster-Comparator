import React from 'react';

interface FaderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  color?: "amber" | "emerald" | "zinc";
}

export const Fader: React.FC<FaderProps> = ({ label, value, onChange, color = "zinc" }) => {
  const accentColors = {
    amber: "accent-amber-500",
    emerald: "accent-emerald-500",
    zinc: "accent-zinc-100"
  };

  return (
    <div className="flex flex-col items-center bg-zinc-900/10 p-2 rounded shrink-0">
      <span className="text-[9px] font-black uppercase opacity-60 mb-3 tracking-widest text-zinc-400">
        {label}
      </span>
      
      {/* The Track Housing */}
      <div className="relative w-12 h-44 bg-zinc-950 rounded border border-zinc-900 shadow-[inset_0_0_15px_black] flex items-center justify-center">
        
        {/* Hardware Scale Markings */}
        <div className="absolute inset-y-4 left-1 w-1 flex flex-col justify-between opacity-30 pointer-events-none z-0">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="h-[1px] w-2 bg-zinc-500" />
          ))}
        </div>
        
        {/* The Fader - Centered Absolute Logic */}
        <div className="absolute inset-0 flex items-center justify-center">
           <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))} 
            className={`retro-fader cursor-ns-resize z-10 ${accentColors[color]}`}
            style={{ 
              width: '150px', 
              transform: 'rotate(-90deg)', 
              background: 'transparent',
              WebkitAppearance: 'none',
              outline: 'none',
              margin: 0
            }}
          />
        </div>
      </div>
      
      <span className="mt-3 font-mono text-[10px] text-zinc-600 font-bold">
        {Math.round(value * 100)}
      </span>
    </div>
  );
};