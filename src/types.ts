export type Locale = 'en' | 'hr';

export type BreathPhase = 'inhale' | 'hold' | 'exhale';

export interface BreathingPreset {
  id: string;
  category: 'pranayama' | 'buteyko' | 'wimhof' | 'basic';
  name: string;
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  sessionMinutes: number;
}

export interface MeditationPreset {
  id: string;
  name: string;
  durationMinutes: number;
}

export type BreathingCueSound = 'soft' | 'wood' | 'cello';
export type MetronomeSound = 'classic' | 'click' | 'wood';
export type EndSound = 'gong' | 'bowl' | 'chime';

export interface AppSettings {
  locale: Locale;
  breathingCueSound: BreathingCueSound;
  metronomeSound: MetronomeSound;
  meditationEndSound: EndSound;
  hapticsEnabled: boolean;
}

export interface SessionStep {
  id: string;
  title: string;
  type: 'breathing' | 'metronome' | 'meditation';
  durationSec: number;
  presetId?: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  steps: SessionStep[];
}
