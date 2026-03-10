import { BreathingPreset, MeditationPreset, SessionTemplate } from '../types';

export const breathingPresets: BreathingPreset[] = [
  {
    id: 'basic-calm',
    category: 'basic',
    name: 'Basic Calm 4-4-6',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 6,
    sessionMinutes: 5,
  },
  {
    id: 'box',
    category: 'pranayama',
    name: 'Box 4-4-4',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 4,
    sessionMinutes: 5,
  },
  {
    id: 'nadi-lite',
    category: 'pranayama',
    name: 'Nadi Lite 4-4-8',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 8,
    sessionMinutes: 6,
  },
  {
    id: 'buteyko-light',
    category: 'buteyko',
    name: 'Buteyko Style 3-2-5',
    inhaleSec: 3,
    holdSec: 2,
    exhaleSec: 5,
    sessionMinutes: 4,
  },
  {
    id: 'wimhof-style',
    category: 'wimhof',
    name: 'Wim Hof Style 2-0-2',
    inhaleSec: 2,
    holdSec: 0,
    exhaleSec: 2,
    sessionMinutes: 3,
  },
];

export const meditationPresets: MeditationPreset[] = [
  { id: '5m', name: '5 min', durationMinutes: 5 },
  { id: '10m', name: '10 min', durationMinutes: 10 },
  { id: '15m', name: '15 min', durationMinutes: 15 },
];

export const sessionTemplates: SessionTemplate[] = [
  {
    id: 'morning-flow',
    name: 'Morning Flow',
    steps: [
      { id: 's1', title: 'Basic Calm', type: 'breathing', durationSec: 180, presetId: 'basic-calm' },
      { id: 's2', title: 'Kapalabhati Metronome', type: 'metronome', durationSec: 120 },
      { id: 's3', title: 'Meditation', type: 'meditation', durationSec: 300 },
    ],
  },
  {
    id: 'focus-stack',
    name: 'Focus Stack',
    steps: [
      { id: 's1', title: 'Box Breathing', type: 'breathing', durationSec: 240, presetId: 'box' },
      { id: 's2', title: 'Buteyko Style', type: 'breathing', durationSec: 180, presetId: 'buteyko-light' },
      { id: 's3', title: 'Meditation', type: 'meditation', durationSec: 300 },
    ],
  },
  {
    id: 'wind-down',
    name: 'Wind Down',
    steps: [
      { id: 's1', title: 'Nadi Lite', type: 'breathing', durationSec: 240, presetId: 'nadi-lite' },
      { id: 's2', title: 'Meditation', type: 'meditation', durationSec: 600 },
    ],
  },
];
