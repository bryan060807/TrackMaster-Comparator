import React from 'react';
import type { ComparatorMode, OutputMeter } from '../hooks/useAudioEngine';

interface DisplayProps {
  containerARef: React.RefObject<HTMLDivElement>;
  containerBRef: React.RefObject<HTMLDivElement>;
  activeTrack: ComparatorMode;
  analyzerData: number[];
  loopStart?: number | null;
  loopEnd?: number | null;
  isMono: boolean;
  invertA: boolean;
  invertB: boolean;
  matchLoudness: boolean;
  outputMeter: OutputMeter;
}

export const Display: React.FC<DisplayProps> = ({ containerARef, containerBRef, activeTrack, analyzerData, loopStart, loopEnd, isMono, invertA, invertB, matchLoudness, outputMeter }) => {
  const isTrackAVisible = activeTrack === 'A' || activeTrack === 'blend' || activeTrack === 'diff';
  const isTrackBVisible = activeTrack === 'B' || activeTrack === 'blend' || activeTrack === 'diff';
  const meterColor = activeTrack === 'B' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : activeTrack === 'diff' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : activeTrack === 'blend' ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
  const modeLabel = activeTrack === 'A' ? 'Source Mix' : activeTrack === 'B' ? 'Mastered' : activeTrack === 'blend' ? 'Blend' : 'Difference';
  const loopLabel = loopStart !== null && loopStart !== undefined
    ? `${loopStart.toFixed(1)}s - ${loopEnd !== null && loopEnd !== undefined ? `${loopEnd.toFixed(1)}s` : 'end'}`
    : null;
  const peakPercent = Math.min(100, outputMeter.peak * 100);
  const rmsDb = outputMeter.rms > 0 ? `${(20 * Math.log10(outputMeter.rms)).toFixed(1)} dBFS` : '-inf dBFS';
  const peakDb = outputMeter.peak > 0 ? `${(20 * Math.log10(outputMeter.peak)).toFixed(1)} dBFS` : '-inf dBFS';

  return (
    <div className="bg-[#050805] border-8 border-zinc-900 rounded-lg p-6 shadow-[inset_0_0_50px_rgba(0,0,0,1)] mb-10 relative overflow-hidden">
      {/* Glass Screen Reflection Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="relative z-20 mb-5 grid grid-cols-2 gap-3 text-[9px] font-black uppercase tracking-widest">
        <div className="bg-black/70 border border-zinc-800 rounded px-3 py-2 text-zinc-500">
          Mode <span className={`ml-2 ${activeTrack === 'diff' ? 'text-red-400' : activeTrack === 'blend' ? 'text-cyan-300' : activeTrack === 'B' ? 'text-emerald-400' : 'text-amber-400'}`}>{modeLabel}</span>
        </div>
        <div className="bg-black/70 border border-zinc-800 rounded px-3 py-2 text-zinc-500 flex gap-3 justify-end">
          <span className={isMono ? 'text-red-400' : 'text-zinc-700'}>Mono</span>
          <span className={invertA ? 'text-amber-400' : 'text-zinc-700'}>Inv A</span>
          <span className={invertB ? 'text-emerald-400' : 'text-zinc-700'}>Inv B</span>
          <span className={matchLoudness ? 'text-cyan-300' : 'text-zinc-700'}>Match</span>
        </div>
      </div>
      
      {/* Track A Section */}
      <div className="relative mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] font-black text-amber-500/40 uppercase tracking-[0.2em]">Source Mix</span>
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isTrackAVisible ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-900'}`} />
        </div>
        <div className={`transition-opacity duration-500 relative ${isTrackAVisible ? 'opacity-100' : 'opacity-20'}`}>
          <div ref={containerARef} />
          {loopLabel && <div className="absolute inset-y-0 left-0 right-0 border-x-2 border-cyan-500/60 bg-cyan-500/5 pointer-events-none flex items-start justify-center"><span className="mt-1 bg-black/70 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-300">{loopLabel}</span></div>}
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
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isTrackBVisible ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-900'}`} />
        </div>
        <div className={`transition-opacity duration-500 relative ${isTrackBVisible ? 'opacity-100' : 'opacity-20'}`}>
          <div ref={containerBRef} />
          {loopLabel && <div className="absolute inset-y-0 left-0 right-0 border-x-2 border-cyan-500/60 bg-cyan-500/5 pointer-events-none flex items-start justify-center"><span className="mt-1 bg-black/70 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-300">{loopLabel}</span></div>}
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
                          : meterColor
                        : 'bg-zinc-900/50'
                    }`} 
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-4 bg-black/80 border-2 border-zinc-800 rounded p-3 shadow-inner">
        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-2">
          <span>Audible Output Meter</span>
          <span className={outputMeter.clipped ? 'text-red-500' : 'text-zinc-700'}>{outputMeter.clipped ? 'Clip Hold' : 'Headroom OK'}</span>
        </div>
        <div className="h-3 bg-zinc-950 rounded overflow-hidden border border-zinc-900">
          <div className={`h-full transition-all duration-75 ${outputMeter.clipped ? 'bg-red-600' : meterColor}`} style={{ width: `${peakPercent}%` }} />
        </div>
        <div className="flex justify-between mt-2 font-mono text-[10px] text-zinc-500">
          <span>Peak {peakDb}</span>
          <span>RMS {rmsDb}</span>
        </div>
      </div>
    </div>
  );
};
