// src/hooks/useAudioEngine.ts
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export const useAudioEngine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [analyzerData, setAnalyzerData] = useState<number[]>(Array(16).fill(0));

  const wsARef = useRef<WaveSurfer | null>(null);
  const wsBRef = useRef<WaveSurfer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<any>(null);

  const initEngine = (containerA: HTMLElement, containerB: HTMLElement) => {
    if (wsARef.current) return; // Prevent double init

    const options = { barWidth: 3, barGap: 2, height: 100, normalize: true };
    wsARef.current = WaveSurfer.create({ container: containerA, ...options, waveColor: '#432010', progressColor: '#f59e0b' });
    wsBRef.current = WaveSurfer.create({ container: containerB, ...options, waveColor: '#064e3b', progressColor: '#10b981' });

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const nodes = {
      monoGainA: ctx.createGain(),
      monoGainB: ctx.createGain(),
      gainA: ctx.createGain(),
      gainB: ctx.createGain(),
      analyzerA: ctx.createAnalyser(),
      analyzerB: ctx.createAnalyser()
    };
    nodes.analyzerA.fftSize = 64;
    nodes.analyzerB.fftSize = 64;

    ctx.createMediaElementSource(wsARef.current.getMediaElement()).connect(nodes.monoGainA).connect(nodes.gainA).connect(nodes.analyzerA).connect(ctx.destination);
    ctx.createMediaElementSource(wsBRef.current.getMediaElement()).connect(nodes.monoGainB).connect(nodes.gainB).connect(nodes.analyzerB).connect(ctx.destination);
    
    nodesRef.current = nodes;

    wsARef.current.on('timeupdate', (t) => setCurrentTime(t));
    
    // Start Analyzer Loop
    const updateAnalyzer = () => {
      if (nodesRef.current) {
        const analyzer = wsARef.current?.isPlaying() ? nodes.analyzerA : nodes.analyzerB;
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(dataArray);
        setAnalyzerData(Array.from(dataArray).slice(0, 16).map(v => (v / 255) * 100));
      }
      requestAnimationFrame(updateAnalyzer);
    };
    updateAnalyzer();
  };

  return { initEngine, wsARef, wsBRef, nodesRef, audioCtxRef, isPlaying, setIsPlaying, currentTime, analyzerData };
};