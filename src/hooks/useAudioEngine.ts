// src/hooks/useAudioEngine.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

type Deck = 'A' | 'B';
export type ComparatorMode = Deck | 'blend' | 'diff';

type AudioNodes = {
  monoGainA: GainNode;
  monoGainB: GainNode;
  phaseA: GainNode;
  phaseB: GainNode;
  gainA: GainNode;
  gainB: GainNode;
  analyzerA: AnalyserNode;
  analyzerB: AnalyserNode;
  masterAnalyzer: AnalyserNode;
};

export type OutputMeter = {
  peak: number;
  rms: number;
  clipped: boolean;
};

type ComparatorSettings = {
  mode: ComparatorMode;
  trimA: number;
  trimB: number;
  volume: number;
  isMono: boolean;
  invertA: boolean;
  invertB: boolean;
  matchLoudness: boolean;
  blendAmount: number;
  nudgeB: number;
  isLooping: boolean;
  loopStart: number;
  loopEnd: number | null;
};

const INITIAL_SETTINGS: ComparatorSettings = {
  mode: 'A',
  trimA: 0.8,
  trimB: 0.8,
  volume: 0.8,
  isMono: false,
  invertA: false,
  invertB: false,
  matchLoudness: false,
  blendAmount: 0.5,
  nudgeB: 0,
  isLooping: false,
  loopStart: 0,
  loopEnd: null,
};

const ANALYZER_BANDS = 16;
// 12 ms is short enough to feel instant, but long enough to avoid most Web Audio click edges.
const GAIN_RAMP_SECONDS = 0.012;
// Seek slightly before the loop boundary so the browser media element does not coast past the end.
const LOOP_LOOKAHEAD_SECONDS = 0.035;
const LOOP_RETRIGGER_GUARD_SECONDS = 0.08;
// Keep sync correction gentle: small drift gets nudged by playbackRate, large drift is seek-corrected.
const SYNC_TOLERANCE_SECONDS = 0.025;
const HARD_SYNC_THRESHOLD_SECONDS = 0.2;
const MAX_RATE_CORRECTION = 0.01;
// Difference mode sums two correlated signals; extra headroom prevents normal null tests from clipping.
const DIFF_GAIN = 0.35;
const CLIP_THRESHOLD = 0.98;
const CLIP_HOLD_SECONDS = 1.5;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const equalPowerA = (amount: number) => Math.cos(clamp(amount, 0, 1) * Math.PI / 2);
const equalPowerB = (amount: number) => Math.sin(clamp(amount, 0, 1) * Math.PI / 2);

export const useAudioEngine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [analyzerData, setAnalyzerData] = useState<number[]>(Array(ANALYZER_BANDS).fill(0));
  const [trackRms, setTrackRms] = useState<Record<Deck, number | null>>({ A: null, B: null });
  const [outputMeter, setOutputMeter] = useState<OutputMeter>({ peak: 0, rms: 0, clipped: false });

  const wsARef = useRef<WaveSurfer | null>(null);
  const wsBRef = useRef<WaveSurfer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNodes | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const settingsRef = useRef<ComparatorSettings>(INITIAL_SETTINGS);
  const isPlayingRef = useRef(false);
  const objectUrlsRef = useRef<Partial<Record<Deck, string>>>({});
  const trackRmsRef = useRef<Record<Deck, number | null>>({ A: null, B: null });
  const clipHoldUntilRef = useRef(0);
  const loopGuardUntilRef = useRef(0);

  const getMedia = (deck: Deck) => (deck === 'A' ? wsARef.current : wsBRef.current)?.getMediaElement() ?? null;

  const getDuration = (deck: Deck) => {
    const wavesurfer = deck === 'A' ? wsARef.current : wsBRef.current;
    const duration = wavesurfer?.getDuration() ?? 0;
    return Number.isFinite(duration) ? duration : 0;
  };

  const getTimeline = () => getMedia('A')?.currentTime ?? 0;

  const getBTimeForTimeline = (timeline: number) => {
    const durationB = getDuration('B');
    const nudgeSeconds = settingsRef.current.nudgeB / 1000;
    const max = durationB > 0 ? durationB : Number.MAX_SAFE_INTEGER;
    return clamp(timeline + nudgeSeconds, 0, max);
  };

  const setMediaTime = (deck: Deck, time: number) => {
    const media = getMedia(deck);
    if (!media || !Number.isFinite(time)) return;

    const duration = getDuration(deck);
    const target = duration > 0 ? clamp(time, 0, duration) : Math.max(0, time);
    if (Math.abs(media.currentTime - target) > 0.005) {
      media.currentTime = target;
    }
  };

  const syncToTimeline = useCallback((timeline: number) => {
    setMediaTime('A', timeline);
    setMediaTime('B', getBTimeForTimeline(timeline));
    setCurrentTime(timeline);
  }, []);

  const maintainDeckSync = () => {
    const mediaB = getMedia('B');
    if (!mediaB || !isPlayingRef.current) return;

    const expectedBTime = getBTimeForTimeline(getTimeline());
    const drift = expectedBTime - mediaB.currentTime;

    if (Math.abs(drift) > HARD_SYNC_THRESHOLD_SECONDS) {
      mediaB.playbackRate = 1;
      setMediaTime('B', expectedBTime);
      return;
    }

    if (Math.abs(drift) > SYNC_TOLERANCE_SECONDS) {
      mediaB.playbackRate = 1 + clamp(drift, -MAX_RATE_CORRECTION, MAX_RATE_CORRECTION);
      return;
    }

    if (mediaB.playbackRate !== 1) {
      mediaB.playbackRate = 1;
    }
  };

  const applyRouting = useCallback(() => {
    const nodes = nodesRef.current;
    const ctx = audioCtxRef.current;
    if (!nodes || !ctx) return;

    const { mode, trimA, trimB, volume, isMono, invertA, invertB, matchLoudness, blendAmount } = settingsRef.current;
    const now = ctx.currentTime;
    const monoValue = isMono ? 0.707 : 1;
    const rmsA = trackRmsRef.current.A;
    const rmsB = trackRmsRef.current.B;
    const rmsTarget = rmsA && rmsB ? Math.min(rmsA, rmsB) : null;
    const loudnessGainA = matchLoudness && rmsTarget && rmsA ? clamp(rmsTarget / rmsA, 0.25, 4) : 1;
    const loudnessGainB = matchLoudness && rmsTarget && rmsB ? clamp(rmsTarget / rmsB, 0.25, 4) : 1;
    let routeGainA = 0;
    let routeGainB = 0;
    let phaseA = invertA ? -1 : 1;
    let phaseB = invertB ? -1 : 1;

    if (mode === 'A') {
      routeGainA = 1;
    } else if (mode === 'B') {
      routeGainB = 1;
    } else if (mode === 'blend') {
      routeGainA = equalPowerA(blendAmount);
      routeGainB = equalPowerB(blendAmount);
    } else {
      routeGainA = DIFF_GAIN;
      routeGainB = DIFF_GAIN;
      phaseB *= -1;
    }

    nodes.monoGainA.channelCount = isMono ? 1 : 2;
    nodes.monoGainB.channelCount = isMono ? 1 : 2;
    nodes.monoGainA.channelCountMode = 'explicit';
    nodes.monoGainB.channelCountMode = 'explicit';
    nodes.monoGainA.gain.setTargetAtTime(monoValue, now, GAIN_RAMP_SECONDS);
    nodes.monoGainB.gain.setTargetAtTime(monoValue, now, GAIN_RAMP_SECONDS);
    nodes.phaseA.gain.setTargetAtTime(phaseA, now, GAIN_RAMP_SECONDS);
    nodes.phaseB.gain.setTargetAtTime(phaseB, now, GAIN_RAMP_SECONDS);

    nodes.gainA.gain.cancelScheduledValues(now);
    nodes.gainB.gain.cancelScheduledValues(now);
    nodes.gainA.gain.setTargetAtTime(volume * trimA * loudnessGainA * routeGainA, now, GAIN_RAMP_SECONDS);
    nodes.gainB.gain.setTargetAtTime(volume * trimB * loudnessGainB * routeGainB, now, GAIN_RAMP_SECONDS);
  }, []);

  const configureComparator = useCallback((settings: ComparatorSettings) => {
    const previousNudge = settingsRef.current.nudgeB;
    settingsRef.current = settings;
    applyRouting();

    if (previousNudge !== settings.nudgeB) {
      setMediaTime('B', getBTimeForTimeline(getTimeline()));
    }
  }, [applyRouting]);

  const measureRms = async (deck: Deck, file: File) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const audioBuffer = await ctx.decodeAudioData(await file.arrayBuffer());
    let sumSquares = 0;
    let sampleCount = 0;
    const step = Math.max(1, Math.floor(audioBuffer.length / 250000));

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
      const data = audioBuffer.getChannelData(channel);
      for (let index = 0; index < data.length; index += step) {
        const sample = data[index];
        sumSquares += sample * sample;
        sampleCount += 1;
      }
    }

    const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : null;
    trackRmsRef.current = { ...trackRmsRef.current, [deck]: rms };
    setTrackRms(trackRmsRef.current);
    applyRouting();
  };

  const loadTrack = useCallback((deck: Deck, file: File) => {
    const wavesurfer = deck === 'A' ? wsARef.current : wsBRef.current;
    if (!wavesurfer) return;

    const previousUrl = objectUrlsRef.current[deck];
    if (previousUrl) URL.revokeObjectURL(previousUrl);

    const nextUrl = URL.createObjectURL(file);
    objectUrlsRef.current[deck] = nextUrl;
    wavesurfer.load(nextUrl);
    void measureRms(deck, file);
  }, [applyRouting]);

  const pause = useCallback(() => {
    getMedia('A')?.pause();
    getMedia('B')?.pause();
    const mediaB = getMedia('B');
    if (mediaB) mediaB.playbackRate = 1;
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const play = useCallback(async () => {
    const mediaA = getMedia('A');
    const mediaB = getMedia('B');
    if (!mediaA || !mediaB) return;

    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    syncToTimeline(getTimeline());
    await Promise.allSettled([mediaA.play(), mediaB.play()]);
    isPlayingRef.current = !mediaA.paused || !mediaB.paused;
    setIsPlaying(isPlayingRef.current);
  }, [syncToTimeline]);

  const togglePlayback = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
      return;
    }

    void play();
  }, [pause, play]);

  const getLoopEnd = () => {
    const { loopEnd } = settingsRef.current;
    if (loopEnd !== null && loopEnd > 0) return loopEnd;

    const durations = [getDuration('A'), getDuration('B')]
      .filter((duration) => duration > 0)
      .map((duration) => duration - settingsRef.current.nudgeB / 1000);

    return durations.length > 0 ? Math.max(0, Math.min(...durations)) : 0;
  };

  const jumpToLoopStart = useCallback(() => {
    const nodes = nodesRef.current;
    const ctx = audioCtxRef.current;
    const { loopStart } = settingsRef.current;
    const wasPlaying = isPlayingRef.current;

    if (nodes && ctx) {
      const now = ctx.currentTime;
      loopGuardUntilRef.current = now + LOOP_RETRIGGER_GUARD_SECONDS;
      nodes.gainA.gain.setTargetAtTime(0, now, GAIN_RAMP_SECONDS);
      nodes.gainB.gain.setTargetAtTime(0, now, GAIN_RAMP_SECONDS);
    }

    syncToTimeline(loopStart);

    if (wasPlaying) {
      void Promise.allSettled([getMedia('A')?.play(), getMedia('B')?.play()]).finally(() => applyRouting());
    } else {
      applyRouting();
    }
  }, [applyRouting, syncToTimeline]);

  const initEngine = useCallback((containerA: HTMLElement, containerB: HTMLElement) => {
    if (wsARef.current) return;

    const options = { barWidth: 3, barGap: 2, height: 100, normalize: true };
    wsARef.current = WaveSurfer.create({ container: containerA, ...options, waveColor: '#432010', progressColor: '#f59e0b' });
    wsBRef.current = WaveSurfer.create({ container: containerB, ...options, waveColor: '#064e3b', progressColor: '#10b981' });

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const nodes: AudioNodes = {
      monoGainA: ctx.createGain(),
      monoGainB: ctx.createGain(),
      phaseA: ctx.createGain(),
      phaseB: ctx.createGain(),
      gainA: ctx.createGain(),
      gainB: ctx.createGain(),
      analyzerA: ctx.createAnalyser(),
      analyzerB: ctx.createAnalyser(),
      masterAnalyzer: ctx.createAnalyser(),
    };
    nodes.analyzerA.fftSize = 2048;
    nodes.analyzerB.fftSize = 2048;
    nodes.masterAnalyzer.fftSize = 2048;
    nodes.gainA.gain.value = settingsRef.current.volume * settingsRef.current.trimA;
    nodes.gainB.gain.value = 0;

    ctx.createMediaElementSource(wsARef.current.getMediaElement())
      .connect(nodes.monoGainA)
      .connect(nodes.phaseA)
      .connect(nodes.gainA)
      .connect(nodes.analyzerA)
      .connect(nodes.masterAnalyzer);
    ctx.createMediaElementSource(wsBRef.current.getMediaElement())
      .connect(nodes.monoGainB)
      .connect(nodes.phaseB)
      .connect(nodes.gainB)
      .connect(nodes.analyzerB)
      .connect(nodes.masterAnalyzer);
    nodes.masterAnalyzer.connect(ctx.destination);

    nodesRef.current = nodes;
    applyRouting();

    const updateAudioState = () => {
      const { mode } = settingsRef.current;
      const activeAnalyzer = mode === 'A' ? nodes.analyzerA : mode === 'B' ? nodes.analyzerB : nodes.masterAnalyzer;
      const dataArray = new Uint8Array(activeAnalyzer.frequencyBinCount);
      activeAnalyzer.getByteFrequencyData(dataArray);
      setAnalyzerData(Array.from(dataArray).slice(0, ANALYZER_BANDS).map((value) => (value / 255) * 100));

      const timeDomainData = new Float32Array(activeAnalyzer.fftSize);
      activeAnalyzer.getFloatTimeDomainData(timeDomainData);
      let peak = 0;
      let sumSquares = 0;
      for (const sample of timeDomainData) {
        const abs = Math.abs(sample);
        peak = Math.max(peak, abs);
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / timeDomainData.length);
      if (peak >= CLIP_THRESHOLD) {
        clipHoldUntilRef.current = audioCtxRef.current?.currentTime ? audioCtxRef.current.currentTime + CLIP_HOLD_SECONDS : clipHoldUntilRef.current;
      }
      setOutputMeter({
        peak: clamp(peak, 0, 1.5),
        rms: clamp(rms, 0, 1),
        clipped: (audioCtxRef.current?.currentTime ?? 0) < clipHoldUntilRef.current,
      });

      const timeline = getTimeline();
      setCurrentTime(timeline);
      maintainDeckSync();

      const ctxTime = audioCtxRef.current?.currentTime ?? 0;
      if (settingsRef.current.isLooping && isPlayingRef.current && ctxTime >= loopGuardUntilRef.current) {
        const loopEnd = getLoopEnd();
        if (loopEnd > settingsRef.current.loopStart && timeline >= loopEnd - LOOP_LOOKAHEAD_SECONDS) {
          jumpToLoopStart();
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateAudioState);
    };

    updateAudioState();
  }, [applyRouting, jumpToLoopStart]);

  useEffect(() => () => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    pause();
    wsARef.current?.destroy();
    wsBRef.current?.destroy();
    Object.values(objectUrlsRef.current).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    audioCtxRef.current?.close();
  }, [pause]);

  return {
    initEngine,
    loadTrack,
    configureComparator,
    togglePlayback,
    wsARef,
    wsBRef,
    nodesRef,
    audioCtxRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    analyzerData,
    trackRms,
    outputMeter,
  };
};
