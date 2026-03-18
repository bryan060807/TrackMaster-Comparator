import React from 'react';

interface DisplayProps {
  containerARef: React.RefObject<HTMLDivElement>;
  containerBRef: React.RefObject<HTMLDivElement>;
  activeTrack: 'A' | 'B';
  analyzerData: number[];
}

export const Display: React.FC<DisplayProps> = ({ containerARef, containerBRef, activeTrack, analyzerData }) => {
  return (
    <div className="bg-[#050805] border-8 border-zinc-900 rounded-lg p-6 shadow-[inset_0_0_50px_rgba(0,0,0,1)] mb-10 relative overflow-hidden">
      {/* Glass Screen Reflection Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      
      {/* Track A Section */}
      <div className="relative mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] font-black text-amber-500/40 uppercase tracking-[0.2em]">Source Mix</span>
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTrack === 'A' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-900'}`} />
        </div>
        <div className={`transition-opacity duration-500 ${activeTrack === 'A' ? 'opacity-100' : 'opacity-20'}`}>
          <div ref={containerARef} />
        </div>
      </div>

      {/* Industrial Divider */}
      <div className="h-[2px] bg-zinc-900 my-6 flex items-center justify-center">
        <div className="w-1/4 h-[1px] bg-zinc-800 shadow-[0_0_10px_black]" />
      </div>

      {/* Track B Section */}
      <div className="relative mb-8">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-[0.2em]">Master Target</span>
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTrack === 'B' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-900'}`} />
        </div>
        <div className={`transition-opacity duration-500 ${activeTrack === 'B' ? 'opacity-100' : 'opacity-20'}`}>
          <div ref={containerBRef} />
        </div>
      </div>

      {/* LED Meter Strip */}
      <div className="relative">
        <div className="absolute -top-4 left-0 text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Real-Time Frequency Analysis</div>
        <div className="h-16 bg-black/80 border-2 border-zinc-800 rounded flex items-end justify-between p-1 gap-[3px] shadow-inner">
          {analyzerData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-[2px] h-full">
              {[...Array(8)].map((_, j) => {
                const threshold = (8 - j) * 12.5;
                const isActive = v >= threshold;
                const isPeak = j < 2;
                
                return (
                  <div 
                    key={j} 
                    className={`w-full h-full rounded-sm transition-colors duration-75 ${
                      isActive 
                        ? isPeak 
                          ? 'bg-red-600 shadow-[0_0_8px_red]' 
                          : (activeTrack === 'A' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]')
                        : 'bg-zinc-900/50'
                    }`} 
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};