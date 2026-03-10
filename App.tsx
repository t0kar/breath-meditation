import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import i18n, { setLocale } from './src/core/i18n';
import { initializeAudio } from './src/core/sound';
import { defaultSettings, loadSettings, saveSettings } from './src/core/storage';
import { PrimaryButton } from './src/components/PrimaryButton';
import { BreathingScreen } from './src/screens/BreathingScreen';
import { MeditationScreen } from './src/screens/MeditationScreen';
import { MetronomeScreen } from './src/screens/MetronomeScreen';
import { SessionsScreen } from './src/screens/SessionsScreen';
import { AppSettings } from './src/types';

type Tab = 'breathe' | 'metronome' | 'meditate' | 'sessions';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('breathe');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    loadSettings().then((saved) => {
      setSettings(saved);
      setLocale(saved.locale);
    });
    initializeAudio().catch(() => undefined);
  }, []);

  const switchLanguage = async () => {
    const next: AppSettings['locale'] = settings.locale === 'en' ? 'hr' : 'en';
    const updated = { ...settings, locale: next };
    setSettings(updated);
    setLocale(next);
    await saveSettings(updated);
  };

  const cycleBreathingSound = async () => {
    const order = ['soft', 'wood', 'cello'] as const;
    const currentIndex = order.indexOf(settings.breathingCueSound);
    const updated = {
      ...settings,
      breathingCueSound: order[(currentIndex + 1) % order.length],
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  const cycleMetronomeSound = async () => {
    const order = ['classic', 'click', 'wood'] as const;
    const currentIndex = order.indexOf(settings.metronomeSound);
    const updated = {
      ...settings,
      metronomeSound: order[(currentIndex + 1) % order.length],
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  const cycleEndSound = async () => {
    const order = ['gong', 'bowl', 'chime'] as const;
    const currentIndex = order.indexOf(settings.meditationEndSound);
    const updated = {
      ...settings,
      meditationEndSound: order[(currentIndex + 1) % order.length],
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  const screen = useMemo(() => {
    if (activeTab === 'breathe') {
      return <BreathingScreen settings={settings} />;
    }
    if (activeTab === 'metronome') {
      return <MetronomeScreen settings={settings} />;
    }
    if (activeTab === 'meditate') {
      return <MeditationScreen settings={settings} />;
    }
    return <SessionsScreen settings={settings} />;
  }, [activeTab, settings]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <PrimaryButton label={settings.locale.toUpperCase()} onPress={switchLanguage} variant="secondary" />
        <PrimaryButton label={`Breath ${settings.breathingCueSound}`} onPress={cycleBreathingSound} variant="secondary" />
        <PrimaryButton label={`Met ${settings.metronomeSound}`} onPress={cycleMetronomeSound} variant="secondary" />
        <PrimaryButton label={`End ${settings.meditationEndSound}`} onPress={cycleEndSound} variant="secondary" />
      </View>

      <View style={styles.content}>{screen}</View>

      <View style={styles.tabBar}>
        <Text style={[styles.tab, activeTab === 'breathe' && styles.tabActive]} onPress={() => setActiveTab('breathe')}>
          {i18n.t('tabs.breathe')}
        </Text>
        <Text style={[styles.tab, activeTab === 'metronome' && styles.tabActive]} onPress={() => setActiveTab('metronome')}>
          {i18n.t('tabs.metronome')}
        </Text>
        <Text style={[styles.tab, activeTab === 'meditate' && styles.tabActive]} onPress={() => setActiveTab('meditate')}>
          {i18n.t('tabs.meditate')}
        </Text>
        <Text style={[styles.tab, activeTab === 'sessions' && styles.tabActive]} onPress={() => setActiveTab('sessions')}>
          {i18n.t('tabs.sessions')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6fbfb',
  },
  topBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#d9ecec',
    backgroundColor: '#ffffff',
  },
  tab: {
    color: '#345050',
    fontWeight: '600',
    fontSize: 14,
  },
  tabActive: {
    color: '#0d6e6e',
    fontWeight: '800',
  },
});
