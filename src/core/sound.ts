import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { BreathPhase, BreathingCueSound, EndSound, MetronomeSound } from '../types';

const audioUris: Record<string, string> = {};
let initialized = false;
let webAudioContext: AudioContext | null = null;
let activeWebBreathOsc: OscillatorNode | null = null;
let activeWebBreathGain: GainNode | null = null;
let activeNativeBreathSound: Audio.Sound | null = null;
let breathStopTimer: ReturnType<typeof setTimeout> | null = null;

const SAMPLE_RATE = 22050;
const isWeb = Platform.OS === 'web';

const clearBreathStopTimer = (): void => {
  if (!breathStopTimer) return;
  clearTimeout(breathStopTimer);
  breathStopTimer = null;
};

export const stopBreathPhaseContinuous = async (): Promise<void> => {
  clearBreathStopTimer();

  if (isWeb) {
    if (activeWebBreathGain && webAudioContext) {
      const now = webAudioContext.currentTime;
      activeWebBreathGain.gain.cancelScheduledValues(now);
      activeWebBreathGain.gain.setTargetAtTime(0.0001, now, 0.02);
    }
    if (activeWebBreathOsc) {
      try {
        activeWebBreathOsc.stop();
      } catch {
        // oscillator can already be stopped
      }
      activeWebBreathOsc.disconnect();
    }
    if (activeWebBreathGain) {
      activeWebBreathGain.disconnect();
    }
    activeWebBreathOsc = null;
    activeWebBreathGain = null;
    return;
  }

  if (!activeNativeBreathSound) return;
  await activeNativeBreathSound.stopAsync().catch(() => undefined);
  await activeNativeBreathSound.unloadAsync().catch(() => undefined);
  activeNativeBreathSound = null;
};

const getWebAudioContext = (): AudioContext | null => {
  if (!isWeb || typeof window === 'undefined') return null;
  if (webAudioContext) return webAudioContext;

  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  webAudioContext = new Ctx();
  return webAudioContext;
};

const playWebTone = (frequency: number, lengthSec: number, volume: number, type: OscillatorType = 'sine'): void => {
  const ctx = getWebAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + lengthSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + lengthSec);
};

export const unlockAudio = async (): Promise<void> => {
  if (!isWeb) {
    await initializeAudio();
    return;
  }

  const ctx = getWebAudioContext();
  if (ctx?.state === 'suspended') {
    await ctx.resume();
  }
  initialized = true;
};

const writeWav = async (name: string, samples: number[]): Promise<string> => {
  const path = `${FileSystem.cacheDirectory}${name}.wav`;
  const header = buildWavHeader(samples.length, SAMPLE_RATE);
  const pcm = new Uint8Array(samples.length * 2);

  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    const int16 = Math.round(value * 32767);
    pcm[i * 2] = int16 & 255;
    pcm[i * 2 + 1] = (int16 >> 8) & 255;
  }

  const merged = new Uint8Array(header.length + pcm.length);
  merged.set(header, 0);
  merged.set(pcm, header.length);

  await FileSystem.writeAsStringAsync(path, Buffer.from(merged).toString('base64'), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
};

const buildWavHeader = (samplesCount: number, sampleRate: number): Uint8Array => {
  const bytesPerSample = 2;
  const channels = 1;
  const byteRate = sampleRate * channels * bytesPerSample;
  const blockAlign = channels * bytesPerSample;
  const dataSize = samplesCount * bytesPerSample;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  writeText(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(view, 8, 'WAVE');
  writeText(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  return new Uint8Array(buffer);
};

const writeText = (view: DataView, offset: number, text: string): void => {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
};

const tone = (frequency: number, lengthSec: number, volume = 0.4): number[] => {
  const count = Math.floor(lengthSec * SAMPLE_RATE);
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.max(0, 1 - i / count);
    out.push(Math.sin(2 * Math.PI * frequency * t) * volume * envelope);
  }
  return out;
};

const click = (lengthSec = 0.05): number[] => {
  const count = Math.floor(lengthSec * SAMPLE_RATE);
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const noise = Math.random() * 2 - 1;
    const envelope = Math.max(0, 1 - i / count);
    out.push(noise * 0.45 * envelope);
  }
  return out;
};

export const initializeAudio = async (): Promise<void> => {
  if (initialized) return;

  if (isWeb) {
    getWebAudioContext();
    initialized = true;
    return;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    staysActiveInBackground: false,
    playThroughEarpieceAndroid: false,
  });

  audioUris.softInhale = await writeWav('soft-inhale', tone(370, 0.18, 0.35));
  audioUris.softExhale = await writeWav('soft-exhale', tone(250, 0.18, 0.35));
  audioUris.woodInhale = await writeWav('wood-inhale', tone(480, 0.08, 0.45));
  audioUris.woodExhale = await writeWav('wood-exhale', tone(330, 0.08, 0.45));
  audioUris.celloInhale = await writeWav('cello-inhale', tone(180, 0.24, 0.45));
  audioUris.celloExhale = await writeWav('cello-exhale', tone(140, 0.24, 0.45));

  audioUris.metClassic = await writeWav('met-classic', click(0.05));
  audioUris.metClick = await writeWav('met-click', tone(920, 0.04, 0.45));
  audioUris.metWood = await writeWav('met-wood', tone(620, 0.05, 0.45));

  audioUris.endGong = await writeWav('end-gong', tone(220, 0.7, 0.5).concat(tone(330, 0.5, 0.25)));
  audioUris.endBowl = await writeWav('end-bowl', tone(440, 0.6, 0.35));
  audioUris.endChime = await writeWav('end-chime', tone(780, 0.45, 0.35));

  initialized = true;
};

const playUri = async (uri: string): Promise<void> => {
  const { sound } = await Audio.Sound.createAsync({ uri });
  await sound.playAsync();
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
    }
  });
};

export const playBreathCue = async (sound: BreathingCueSound, phase: BreathPhase): Promise<void> => {
  if (isWeb) {
    await unlockAudio();
    const map: Record<BreathingCueSound, { inhale: number; exhale: number }> = {
      soft: { inhale: 360, exhale: 250 },
      wood: { inhale: 520, exhale: 340 },
      cello: { inhale: 190, exhale: 140 },
    };
    playWebTone(phase === 'inhale' ? map[sound].inhale : map[sound].exhale, 0.12, 0.12, 'sine');
    return;
  }

  if (!initialized) await initializeAudio();
  const key = `${sound}${phase === 'inhale' ? 'Inhale' : 'Exhale'}`;
  const fallback = phase === 'inhale' ? audioUris.softInhale : audioUris.softExhale;
  await playUri(audioUris[key] ?? fallback);
};

export const playBreathPhaseContinuous = async (
  sound: BreathingCueSound,
  phase: BreathPhase,
  durationSec: number,
): Promise<void> => {
  if (phase === 'hold' || durationSec <= 0) {
    await stopBreathPhaseContinuous();
    return;
  }

  await stopBreathPhaseContinuous();

  if (isWeb) {
    await unlockAudio();
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const map: Record<BreathingCueSound, { inhale: number; exhale: number }> = {
      soft: { inhale: 360, exhale: 250 },
      wood: { inhale: 520, exhale: 340 },
      cello: { inhale: 190, exhale: 140 },
    };

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sound === 'wood' ? 'triangle' : 'sine';
    osc.frequency.value = phase === 'inhale' ? map[sound].inhale : map[sound].exhale;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.09, now + Math.max(0.09, durationSec - 0.12));
    gain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.03);

    activeWebBreathOsc = osc;
    activeWebBreathGain = gain;
    breathStopTimer = setTimeout(() => {
      stopBreathPhaseContinuous().catch(() => undefined);
    }, Math.ceil(durationSec * 1000));
    return;
  }

  if (!initialized) await initializeAudio();

  const key = `${sound}${phase === 'inhale' ? 'Inhale' : 'Exhale'}`;
  const fallback = phase === 'inhale' ? audioUris.softInhale : audioUris.softExhale;
  const uri = audioUris[key] ?? fallback;

  const { sound: loopingSound } = await Audio.Sound.createAsync(
    { uri },
    {
      isLooping: true,
      shouldPlay: true,
      volume: 0.35,
    },
  );

  activeNativeBreathSound = loopingSound;
  breathStopTimer = setTimeout(() => {
    stopBreathPhaseContinuous().catch(() => undefined);
  }, Math.ceil(durationSec * 1000));
};

export const playMetronomeBeat = async (sound: MetronomeSound): Promise<void> => {
  if (isWeb) {
    await unlockAudio();
    const map: Record<MetronomeSound, number> = {
      classic: 1000,
      click: 1400,
      wood: 760,
    };
    playWebTone(map[sound], 0.05, 0.2, 'square');
    return;
  }

  if (!initialized) await initializeAudio();
  const map: Record<MetronomeSound, string> = {
    classic: audioUris.metClassic,
    click: audioUris.metClick,
    wood: audioUris.metWood,
  };
  await playUri(map[sound]);
};

export const playEndSound = async (sound: EndSound): Promise<void> => {
  if (isWeb) {
    await unlockAudio();
    if (sound === 'gong') {
      playWebTone(220, 0.55, 0.22, 'triangle');
      setTimeout(() => playWebTone(330, 0.45, 0.16, 'triangle'), 140);
      return;
    }
    if (sound === 'bowl') {
      playWebTone(480, 0.5, 0.18, 'sine');
      return;
    }
    playWebTone(820, 0.35, 0.15, 'sine');
    return;
  }

  if (!initialized) await initializeAudio();
  const map: Record<EndSound, string> = {
    gong: audioUris.endGong,
    bowl: audioUris.endBowl,
    chime: audioUris.endChime,
  };
  await playUri(map[sound]);
};
