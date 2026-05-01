import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useAudioEngine } from './hooks/useAudioEngine';
import type { ComparatorMode } from './hooks/useAudioEngine';
import { Fader } from './components/Fader';
import { Display } from './components/Display';
import { InputModule } from './components/InputModule';
import { Transport } from './components/Transport';

const readNumber = (key: string, fallback: number) => {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
};

const readBoolean = (key: string, fallback = false) => {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === 'true';
};

const readMode = () => {
  const value = localStorage.getItem('tm-mode');
  return value === 'A' || value === 'B' || value === 'blend' || value === 'diff' ? value : 'A';
};

const Screw = ({ className }: { className?: string }) => (
  <div className={`absolute w-5 h-5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 border border-zinc-600 shadow-sm flex items-center justify-center ${className}`}>
    <div className="w-full h-[2px] bg-zinc-700 rotate-45 opacity-60"></div>
  </div>
);

export default function App() {
  // --- State Management ---
  const [trackAFile, setTrackAFile] = useState<File | null>(null);
  const [trackBFile, setTrackBFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ComparatorMode>(() => readMode());
  const [showHelp, setShowHelp] = useState(false);

  // Audio Settings (Persisted)
  const [trimA, setTrimA] = useState(() => readNumber('tm-trimA', 0.8));
  const [trimB, setTrimB] = useState(() => readNumber('tm-trimB', 0.8));
  const [nudgeB, setNudgeB] = useState(() => readNumber('tm-nudgeB', 0));
  const [volume, setVolume] = useState(0.8);
  const [isMono, setIsMono] = useState(() => readBoolean('tm-isMono'));
  const [isLooping, setIsLooping] = useState(() => readBoolean('tm-isLooping'));
  const [invertA, setInvertA] = useState(() => readBoolean('tm-invertA'));
  const [invertB, setInvertB] = useState(() => readBoolean('tm-invertB'));
  const [matchLoudness, setMatchLoudness] = useState(() => readBoolean('tm-matchLoudness'));
  const [blendAmount, setBlendAmount] = useState(() => readNumber('tm-blendAmount', 0.5));
  const [loopStart, setLoopStart] = useState(() => readNumber('tm-loopStart', 0));
  const [loopEnd, setLoopEnd] = useState<number | null>(() => {
    const value = localStorage.getItem('tm-loopEnd');
    if (value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

  // Audio Engine Hook
  const { 
    initEngine, 
    loadTrack,
    configureComparator,
    togglePlayback,
    isPlaying, 
    currentTime, 
    analyzerData,
    trackRms,
    outputMeter,
  } = useAudioEngine();

  const containerARef = useRef<HTMLDivElement>(null);
  const containerBRef = useRef<HTMLDivElement>(null);

  // --- Initialize Engine on Mount ---
  useEffect(() => {
    if (containerARef.current && containerBRef.current) {
      initEngine(containerARef.current, containerBRef.current);
    }
  }, [initEngine]);

  // --- Load Files into WaveSurfer ---
  useEffect(() => {
    if (trackAFile) {
      loadTrack('A', trackAFile);
    }
  }, [loadTrack, trackAFile]);

  useEffect(() => {
    if (trackBFile) {
      loadTrack('B', trackBFile);
    }
  }, [loadTrack, trackBFile]);

  // --- Sync Settings to Storage & Audio Engine ---
  useEffect(() => {
    localStorage.setItem('tm-trimA', trimA.toString());
    localStorage.setItem('tm-trimB', trimB.toString());
    localStorage.setItem('tm-nudgeB', nudgeB.toString());
    localStorage.setItem('tm-mode', mode);
    localStorage.setItem('tm-isMono', isMono.toString());
    localStorage.setItem('tm-invertA', invertA.toString());
    localStorage.setItem('tm-invertB', invertB.toString());
    localStorage.setItem('tm-matchLoudness', matchLoudness.toString());
    localStorage.setItem('tm-blendAmount', blendAmount.toString());
    localStorage.setItem('tm-isLooping', isLooping.toString());
    localStorage.setItem('tm-loopStart', loopStart.toString());
    localStorage.setItem('tm-loopEnd', loopEnd?.toString() ?? '');

    configureComparator({
      mode,
      trimA,
      trimB,
      volume,
      isMono,
      invertA,
      invertB,
      matchLoudness,
      blendAmount,
      nudgeB,
      isLooping,
      loopStart,
      loopEnd,
    });
  }, [blendAmount, configureComparator, invertA, invertB, isLooping, isMono, loopEnd, loopStart, matchLoudness, mode, nudgeB, trimA, trimB, volume]);

  // --- Handle Playback Toggle ---
  const handleTogglePlay = () => {
    togglePlayback();
  };

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8 flex items-center justify-center font-sans text-zinc-300">
      {/* Outer Wood Frame */}
      <div className="w-full max-w-6xl bg-gradient-to-b from-[#3d240f] to-[#1a0f05] p-4 md:p-6 rounded-xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] border border-black">
        
        {/* Metal Faceplate */}
        <div className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-sm border-2 border-zinc-600 p-6 md:p-10 relative shadow-inner">
          <Screw className="top-4 left-4" /> <Screw className="top-4 right-4" />
          <Screw className="bottom-4 left-4" /> <Screw className="bottom-4 right-4" />

          {/* Header */}
          <div className="flex justify-between items-end mb-8 border-b-2 border-zinc-900/40 pb-5">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter uppercase italic">Aibry TrackMaster</h1>
              <p className="text-[10px] font-bold text-zinc-900 tracking-[0.3em] uppercase opacity-70">Solid State A/B Comparator // Model 4000</p>
            </div>
            <button onClick={() => setShowHelp(true)} className="flex flex-col items-center gap-1 text-zinc-800 hover:text-amber-500 transition-colors">
              <HelpCircle className="w-6 h-6" /><span className="text-[9px] font-black tracking-widest">HELP</span>
            </button>
          </div>

          {/* Display Component */}
          <Display 
            containerARef={containerARef} 
            containerBRef={containerBRef} 
            activeTrack={mode} 
            analyzerData={analyzerData} 
            loopStart={isLooping ? loopStart : null}
            loopEnd={isLooping ? loopEnd : null}
            isMono={isMono}
            invertA={invertA}
            invertB={invertB}
            matchLoudness={matchLoudness}
            outputMeter={outputMeter}
          />

          {/* Control Grid */}
          <div className="grid grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Input Calibration */}
            <div className="col-span-4 bg-zinc-800/30 p-5 rounded border border-zinc-900/50 shadow-inner min-h-full">
              <h3 className="text-[10px] font-black tracking-widest uppercase text-zinc-900 opacity-50 mb-6">Input Stage</h3>
              <div className="space-y-8">
                <InputModule 
                  track="A" 
                  fileName={trackAFile?.name} 
                  onFileSelect={setTrackAFile} 
                />
                <InputModule 
                  track="B" 
                  fileName={trackBFile?.name} 
                  onFileSelect={setTrackBFile} 
                  nudgeValue={nudgeB}
                  onNudgeChange={setNudgeB}
                />
              </div>
            </div>

            {/* Center Column: Transport & Routing */}
            <div className="col-span-5 flex flex-col items-center justify-between bg-zinc-800/30 p-5 rounded border border-zinc-900/50 shadow-inner min-h-full">
              <Transport 
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                isMono={isMono}
                onToggleMono={() => setIsMono(!isMono)}
                isLooping={isLooping}
                onToggleLoop={() => setIsLooping(!isLooping)}
              />

              <div className="flex bg-zinc-950 p-2 rounded border border-zinc-900 gap-2 w-full mt-8">
                <button 
                  onClick={() => setMode('A')} 
                  className={`flex-1 py-4 font-black text-sm rounded border-b-4 transition-all ${mode === 'A' ? 'bg-amber-500 border-amber-700 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-zinc-800 border-zinc-900 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  SOURCE MIX
                </button>
                <button 
                  onClick={() => setMode('B')} 
                  className={`flex-1 py-4 font-black text-sm rounded border-b-4 transition-all ${mode === 'B' ? 'bg-emerald-500 border-emerald-700 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-zinc-800 border-zinc-900 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  MASTERED
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                <button
                  onClick={() => setMode('blend')}
                  className={`py-3 rounded border-b-4 text-[10px] font-black uppercase transition-all ${mode === 'blend' ? 'bg-cyan-500 border-cyan-700 text-black' : 'bg-zinc-900 border-zinc-950 text-zinc-500 hover:text-zinc-200'}`}
                >
                  Blend
                </button>
                <button
                  onClick={() => setMode('diff')}
                  className={`py-3 rounded border-b-4 text-[10px] font-black uppercase transition-all ${mode === 'diff' ? 'bg-red-500 border-red-700 text-black' : 'bg-zinc-900 border-zinc-950 text-zinc-500 hover:text-zinc-200'}`}
                >
                  Difference
                </button>
              </div>

              <div className="w-full mt-4 bg-zinc-950/80 p-3 border border-zinc-900 rounded">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                  <span>A</span><span>Blend Crossfader</span><span>B</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={blendAmount}
                  onChange={(event) => setBlendAmount(Number(event.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 w-full mt-4">
                <button
                  onClick={() => setMatchLoudness(!matchLoudness)}
                  className={`py-3 rounded border text-[9px] font-black uppercase transition-all ${matchLoudness ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-zinc-800 text-zinc-600 bg-zinc-900'}`}
                  title={`A RMS ${trackRms.A?.toFixed(4) ?? 'pending'} / B RMS ${trackRms.B?.toFixed(4) ?? 'pending'}`}
                >
                  Match Loudness
                </button>
                <button
                  onClick={() => setInvertA(!invertA)}
                  className={`py-3 rounded border text-[9px] font-black uppercase transition-all ${invertA ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-zinc-800 text-zinc-600 bg-zinc-900'}`}
                >
                  Invert A
                </button>
                <button
                  onClick={() => setInvertB(!invertB)}
                  className={`py-3 rounded border text-[9px] font-black uppercase transition-all ${invertB ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-zinc-800 text-zinc-600 bg-zinc-900'}`}
                >
                  Invert B
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-4 bg-zinc-950/80 p-3 border border-zinc-900 rounded">
                <label className="flex flex-col gap-1 text-[9px] font-black uppercase text-zinc-600">
                  Loop Start
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={loopStart}
                    onChange={(event) => setLoopStart(Math.max(0, Number(event.target.value)))}
                    className="bg-black border border-zinc-800 rounded px-2 py-2 text-xs font-mono text-zinc-300"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[9px] font-black uppercase text-zinc-600">
                  Loop End
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={loopEnd ?? ''}
                    placeholder="End"
                    onChange={(event) => setLoopEnd(event.target.value === '' ? null : Math.max(0, Number(event.target.value)))}
                    className="bg-black border border-zinc-800 rounded px-2 py-2 text-xs font-mono text-zinc-300"
                  />
                </label>
                <div className="col-span-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                    <span>Loop Range</span>
                    <span>{loopStart.toFixed(1)}s - {loopEnd === null ? 'end' : `${loopEnd.toFixed(1)}s`}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(10, loopEnd ?? 10)}
                    step="0.1"
                    value={loopStart}
                    onChange={(event) => setLoopStart(Math.max(0, Number(event.target.value)))}
                    className="w-full accent-cyan-500"
                  />
                  <input
                    type="range"
                    min={loopStart}
                    max={Math.max(10, loopEnd ?? 10)}
                    step="0.1"
                    value={loopEnd ?? Math.max(10, loopStart)}
                    onChange={(event) => setLoopEnd(Math.max(loopStart, Number(event.target.value)))}
                    className="w-full accent-cyan-300 mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Output & Levels */}
            <div className="col-span-3 flex justify-between bg-zinc-800/30 p-5 rounded border border-zinc-900/50 shadow-inner h-full">
              <Fader label="Trim A" value={trimA} onChange={setTrimA} color="amber" />
              <Fader label="Trim B" value={trimB} onChange={setTrimB} color="emerald" />
              <div className="w-[1px] bg-zinc-900/50 mx-1 self-stretch" />
              <Fader label="Master" value={volume} onChange={setVolume} color="zinc" />
            </div>

          </div>
        </div>
      </div>

      {/* Manual Overlay */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border-2 border-amber-500/50 rounded p-10 max-w-xl relative shadow-2xl">
            <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><X size={24}/></button>
            <h2 className="text-2xl font-black text-amber-500 mb-6 tracking-widest uppercase italic border-b border-zinc-800 pb-2">System Manual</h2>
            <div className="space-y-4 text-sm text-zinc-400 font-mono">
              <p><span className="text-zinc-100 font-bold uppercase">[ Source Mix ]</span>: Monitors the original unmastered signal (Amber Spectrum).</p>
              <p><span className="text-zinc-100 font-bold uppercase">[ Mastered ]</span>: Monitors the processed target signal (Emerald Spectrum).</p>
              <p><span className="text-zinc-100 font-bold uppercase">[ Mono Check ]</span>: Collapses stereo field to center (L+R Summing).</p>
              <p><span className="text-zinc-100 font-bold uppercase">[ Phase Nudge ]</span>: Millisecond timing adjustment to align asynchronous signals.</p>
            </div>
            <button onClick={() => setShowHelp(false)} className="mt-10 w-full py-4 bg-amber-600 text-black font-black uppercase hover:bg-amber-500 transition-all">Close Manual</button>
          </div>
        </div>
      )}
    </div>
  );
}
