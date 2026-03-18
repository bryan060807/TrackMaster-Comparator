import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { Fader } from './components/Fader';
import { Display } from './components/Display';
import { InputModule } from './components/InputModule';
import { Transport } from './components/Transport';

const Screw = ({ className }: { className?: string }) => (
  <div className={`absolute w-5 h-5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 border border-zinc-600 shadow-sm flex items-center justify-center ${className}`}>
    <div className="w-full h-[2px] bg-zinc-700 rotate-45 opacity-60"></div>
  </div>
);

export default function App() {
  // --- State Management ---
  const [trackAFile, setTrackAFile] = useState<File | null>(null);
  const [trackBFile, setTrackBFile] = useState<File | null>(null);
  const [activeTrack, setActiveTrack] = useState<'A' | 'B'>('A');
  const [showHelp, setShowHelp] = useState(false);

  // Audio Settings (Persisted)
  const [trimA, setTrimA] = useState(() => Number(localStorage.getItem('tm-trimA')) || 0.8);
  const [trimB, setTrimB] = useState(() => Number(localStorage.getItem('tm-trimB')) || 0.8);
  const [nudgeB, setNudgeB] = useState(() => Number(localStorage.getItem('tm-nudgeB')) || 0);
  const [volume, setVolume] = useState(0.8);
  const [isMono, setIsMono] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Audio Engine Hook
  const { 
    initEngine, 
    wsARef, 
    wsBRef, 
    nodesRef,
    audioCtxRef,
    isPlaying, 
    setIsPlaying, 
    currentTime, 
    analyzerData 
  } = useAudioEngine();

  const containerARef = useRef<HTMLDivElement>(null);
  const containerBRef = useRef<HTMLDivElement>(null);

  // --- Initialize Engine on Mount ---
  useEffect(() => {
    if (containerARef.current && containerBRef.current) {
      initEngine(containerARef.current, containerBRef.current);
    }
  }, []);

  // --- Load Files into WaveSurfer ---
  useEffect(() => {
    if (trackAFile && wsARef.current) {
      wsARef.current.load(URL.createObjectURL(trackAFile));
    }
  }, [trackAFile]);

  useEffect(() => {
    if (trackBFile && wsBRef.current) {
      wsBRef.current.load(URL.createObjectURL(trackBFile));
    }
  }, [trackBFile]);

  // --- Sync Settings to Storage & Audio Engine ---
  useEffect(() => {
    localStorage.setItem('tm-trimA', trimA.toString());
    localStorage.setItem('tm-trimB', trimB.toString());
    localStorage.setItem('tm-nudgeB', nudgeB.toString());

    if (nodesRef.current && audioCtxRef.current) {
      const { gainA, gainB, monoGainA, monoGainB } = nodesRef.current;
      const ctx = audioCtxRef.current;
      const ramp = 0.015;

      // Handle Mono Summing
      const monoVal = isMono ? 0.707 : 1;
      monoGainA.channelCount = isMono ? 1 : 2;
      monoGainB.channelCount = isMono ? 1 : 2;
      monoGainA.gain.setTargetAtTime(monoVal, ctx.currentTime, ramp);
      monoGainB.gain.setTargetAtTime(monoVal, ctx.currentTime, ramp);

      // Handle A/B Switching and Volume
      if (activeTrack === 'A') {
        gainA.gain.setTargetAtTime(volume * trimA, ctx.currentTime, ramp);
        gainB.gain.setTargetAtTime(0, ctx.currentTime, ramp);
      } else {
        gainA.gain.setTargetAtTime(0, ctx.currentTime, ramp);
        gainB.gain.setTargetAtTime(volume * trimB, ctx.currentTime, ramp);
      }
    }
  }, [trimA, trimB, nudgeB, volume, activeTrack, isMono]);

  // --- Handle Playback Toggle ---
  const handleTogglePlay = () => {
    if (!wsARef.current || !wsBRef.current) return;
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();

    if (isPlaying) {
      wsARef.current.pause();
      wsBRef.current.pause();
    } else {
      wsARef.current.play();
      wsBRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
            activeTrack={activeTrack} 
            analyzerData={analyzerData} 
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
                  onClick={() => setActiveTrack('A')} 
                  className={`flex-1 py-4 font-black text-sm rounded border-b-4 transition-all ${activeTrack === 'A' ? 'bg-amber-500 border-amber-700 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-zinc-800 border-zinc-900 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  SOURCE MIX
                </button>
                <button 
                  onClick={() => setActiveTrack('B')} 
                  className={`flex-1 py-4 font-black text-sm rounded border-b-4 transition-all ${activeTrack === 'B' ? 'bg-emerald-500 border-emerald-700 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-zinc-800 border-zinc-900 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  MASTERED
                </button>
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