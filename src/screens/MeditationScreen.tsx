import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import i18n from '../core/i18n';
import { playEndSound, unlockAudio } from '../core/sound';
import { formatClock } from '../core/time';
import { meditationPresets } from '../data/presets';
import { AppSettings } from '../types';
import { PrimaryButton } from '../components/PrimaryButton';
import { StepperField } from '../components/StepperField';

interface MeditationScreenProps {
  settings: AppSettings;
}

export const MeditationScreen = ({ settings }: MeditationScreenProps) => {
  const [minutes, setMinutes] = useState(10);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    if (!startRef.current) startRef.current = Date.now() - elapsedMs;

    const id = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 100);

    return () => clearInterval(id);
  }, [running, elapsedMs]);

  const totalMs = minutes * 60 * 1000;
  const remainingSec = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));

  useEffect(() => {
    if (running && elapsedMs >= totalMs) {
      setRunning(false);
      setElapsedMs(totalMs);
      startRef.current = 0;
      playEndSound(settings.meditationEndSound).catch(() => undefined);
    }
  }, [elapsedMs, running, totalMs, settings.meditationEndSound]);

  const toggle = async () => {
    if (running) {
      setRunning(false);
      return;
    }
    if (elapsedMs >= totalMs) {
      setElapsedMs(0);
      startRef.current = 0;
    }
    await unlockAudio();
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setElapsedMs(0);
    startRef.current = 0;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{settings.locale === 'hr' ? 'Meditacija' : 'Meditation Timer'}</Text>
      <Text style={styles.subtitle}>{settings.locale === 'hr' ? 'Zavrsni zvuk' : 'End sound'}: {settings.meditationEndSound}</Text>

      <View style={styles.clockCard}>
        <Text style={styles.clock}>{formatClock(remainingSec)}</Text>
      </View>

      <View style={styles.chips}>
        {meditationPresets.map((p) => (
          <Text key={p.id} style={[styles.chip, p.durationMinutes === minutes && styles.chipActive]} onPress={() => setMinutes(p.durationMinutes)}>
            {p.name}
          </Text>
        ))}
      </View>

      <View style={styles.block}>
        <StepperField
          label={settings.locale === 'hr' ? 'Trajanje (min)' : 'Duration (min)'}
          value={minutes}
          onChange={setMinutes}
          min={1}
          max={120}
        />
      </View>

      <View style={styles.actionsRow}>
        <PrimaryButton label={running ? i18n.t('common.pause') : elapsedMs > 0 ? i18n.t('common.resume') : i18n.t('common.start')} onPress={toggle} />
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
  clockCard: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  clock: {
    fontSize: 70,
    fontWeight: '800',
    color: '#0d6e6e',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#e5f3f3',
    color: '#0f3a3a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 14,
  },
  chipActive: {
    backgroundColor: '#0d6e6e',
    color: '#ffffff',
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
