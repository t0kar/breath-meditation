import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import i18n from '../core/i18n';
import { playMetronomeBeat, unlockAudio } from '../core/sound';
import { clamp, formatClock } from '../core/time';
import { AppSettings } from '../types';
import { PrimaryButton } from '../components/PrimaryButton';
import { StepperField } from '../components/StepperField';

interface MetronomeScreenProps {
  settings: AppSettings;
}

export const MetronomeScreen = ({ settings }: MetronomeScreenProps) => {
  const [bpm, setBpm] = useState(60);
  const [running, setRunning] = useState(false);
  const [beats, setBeats] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;

    if (!startRef.current) startRef.current = Date.now();

    const elapsedId = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);

    const interval = 60000 / clamp(bpm, 20, 240);
    let expected = Date.now();

    const tick = () => {
      setBeats((prev) => prev + 1);
      playMetronomeBeat(settings.metronomeSound).catch(() => undefined);
      if (settings.hapticsEnabled) {
        Haptics.selectionAsync().catch(() => undefined);
      }

      expected += interval;
      const driftSafe = Math.max(0, expected - Date.now());
      timeoutRef.current = setTimeout(tick, driftSafe);
    };

    tick();

    return () => {
      clearInterval(elapsedId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [running, bpm, settings.metronomeSound, settings.hapticsEnabled]);

  const toggleRun = async () => {
    if (!running) {
      await unlockAudio();
    }
    setRunning((prev) => !prev);
  };

  const reset = () => {
    setRunning(false);
    setBeats(0);
    setElapsedSec(0);
    startRef.current = 0;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{settings.locale === 'hr' ? 'Metronom' : 'Metronome'}</Text>
      <Text style={styles.subtitle}>Kapalabhati / rhythm breath</Text>

      <View style={styles.displayCard}>
        <Text style={styles.bigNumber}>{bpm}</Text>
        <Text style={styles.caption}>BPM</Text>
        <Text style={styles.counter}>{settings.locale === 'hr' ? 'Otkucaji' : 'Beats'}: {beats}</Text>
        <Text style={styles.counter}>{settings.locale === 'hr' ? 'Vrijeme' : 'Time'}: {formatClock(elapsedSec)}</Text>
      </View>

      <View style={styles.block}>
        <StepperField label="BPM" value={bpm} onChange={(value) => setBpm(clamp(value, 20, 240))} min={20} max={240} />
      </View>

      <View style={styles.actionsRow}>
        <PrimaryButton label={running ? i18n.t('common.pause') : i18n.t('common.start')} onPress={toggleRun} />
        <PrimaryButton label={i18n.t('common.reset')} onPress={reset} variant="secondary" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: '#f6fbfb',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#122020',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 16,
    color: '#345050',
  },
  displayCard: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  bigNumber: {
    fontSize: 82,
    fontWeight: '800',
    color: '#0d6e6e',
  },
  caption: {
    marginTop: -4,
    fontSize: 18,
    color: '#345050',
  },
  counter: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '700',
    color: '#1b2f2f',
  },
  block: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
