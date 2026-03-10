import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, BreathingPreset } from '../types';

const SETTINGS_KEY = 'app_settings_v1';
const CUSTOM_PRESETS_KEY = 'custom_breathing_presets_v1';

export const defaultSettings: AppSettings = {
  locale: 'en',
  breathingCueSound: 'soft',
  metronomeSound: 'classic',
  meditationEndSound: 'gong',
  hapticsEnabled: true,
};

export const loadSettings = async (): Promise<AppSettings> => {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;

  try {
    return { ...defaultSettings, ...JSON.parse(raw) } as AppSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadCustomBreathingPresets = async (): Promise<BreathingPreset[]> => {
  const raw = await AsyncStorage.getItem(CUSTOM_PRESETS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as BreathingPreset[];
  } catch {
    return [];
  }
};

export const saveCustomBreathingPresets = async (presets: BreathingPreset[]): Promise<void> => {
  await AsyncStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
};
