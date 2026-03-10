import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import i18n from '../core/i18n';
import { playEndSound, unlockAudio } from '../core/sound';
import { formatClock } from '../core/time';
import { breathingPresets, sessionTemplates } from '../data/presets';
import { AppSettings } from '../types';
import { PrimaryButton } from '../components/PrimaryButton';

interface SessionsScreenProps {
  settings: AppSettings;
}

export const SessionsScreen = ({ settings }: SessionsScreenProps) => {
  const [selectedId, setSelectedId] = useState(sessionTemplates[0].id);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startRef = useRef(0);

  const template = useMemo(() => {
    return sessionTemplates.find((t) => t.id === selectedId) ?? sessionTemplates[0];
  }, [selectedId]);

  const currentStep = template.steps[stepIndex];
  const stepTotalMs = currentStep ? currentStep.durationSec * 1000 : 0;
  const sessionTotalSec = template.steps.reduce((sum, step) => sum + step.durationSec, 0);

  useEffect(() => {
    if (!running || !currentStep) return;
    if (!startRef.current) startRef.current = Date.now() - elapsedMs;

    const id = setInterval(() => {
      const nextElapsed = Date.now() - startRef.current;
      setElapsedMs(nextElapsed);

      if (nextElapsed >= stepTotalMs) {
        const nextStep = stepIndex + 1;
        if (nextStep >= template.steps.length) {
          setRunning(false);
          setStepIndex(template.steps.length - 1);
          setElapsedMs(stepTotalMs);
          playEndSound(settings.meditationEndSound).catch(() => undefined);
          return;
        }

        setStepIndex(nextStep);
        setElapsedMs(0);
        startRef.current = Date.now();
      }
    }, 100);

    return () => clearInterval(id);
  }, [running, stepIndex, template, stepTotalMs, currentStep, settings.meditationEndSound]);

  const reset = () => {
    setRunning(false);
    setStepIndex(0);
    setElapsedMs(0);
    startRef.current = 0;
  };

  const toggle = async () => {
    if (running) {
      setRunning(false);
      return;
    }
    await unlockAudio();
    setRunning(true);
  };

  const remainingSec = Math.max(0, Math.ceil((stepTotalMs - elapsedMs) / 1000));

  const breathingHint = useMemo(() => {
    if (!currentStep?.presetId) return '';
    const preset = breathingPresets.find((p) => p.id === currentStep.presetId);
    if (!preset) return '';
    return `${preset.inhaleSec}:${preset.holdSec}:${preset.exhaleSec}`;
  }, [currentStep]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{settings.locale === 'hr' ? 'Sesije' : 'Session Builder'}</Text>
      <Text style={styles.subtitle}>{settings.locale === 'hr' ? 'Gotovi slijed vjezbi' : 'Fixed multi-step sequences'}</Text>

      <View style={styles.chips}>
        {sessionTemplates.map((s) => (
          <Text key={s.id} style={[styles.chip, s.id === selectedId && styles.chipActive]} onPress={() => {
            setSelectedId(s.id);
            reset();
          }}>
            {s.name}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.stepType}>{settings.locale === 'hr' ? 'Korak' : 'Step'} {stepIndex + 1}/{template.steps.length}</Text>
        <Text style={styles.stepTitle}>{currentStep?.title}</Text>
        <Text style={styles.clock}>{formatClock(remainingSec)}</Text>
        <Text style={styles.meta}>{settings.locale === 'hr' ? 'Ukupno' : 'Total'}: {formatClock(sessionTotalSec)}</Text>
        {breathingHint ? <Text style={styles.meta}>{settings.locale === 'hr' ? 'Omjer disanja' : 'Breathing ratio'}: {breathingHint}</Text> : null}
      </View>

      <View style={styles.actionsRow}>
        <PrimaryButton label={running ? i18n.t('common.pause') : i18n.t('common.start')} onPress={toggle} />
        <PrimaryButton label={i18n.t('common.reset')} onPress={reset} variant="secondary" />
      </View>

      <View style={styles.block}>
        {template.steps.map((step, index) => (
          <Text key={step.id} style={[styles.stepLine, index === stepIndex && styles.stepLineActive]}>
            {index + 1}. {step.title} ({formatClock(step.durationSec)})
          </Text>
        ))}
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  card: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  stepType: {
    fontSize: 18,
    color: '#345050',
  },
  stepTitle: {
    marginTop: 6,
    fontSize: 28,
    color: '#122020',
    fontWeight: '800',
    textAlign: 'center',
  },
  clock: {
    marginTop: 8,
    fontSize: 56,
    fontWeight: '800',
    color: '#0d6e6e',
  },
  meta: {
    marginTop: 4,
    fontSize: 16,
    color: '#3d5959',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  block: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 7,
  },
  stepLine: {
    fontSize: 15,
    color: '#345050',
  },
  stepLineActive: {
    color: '#0d6e6e',
    fontWeight: '800',
  },
});
