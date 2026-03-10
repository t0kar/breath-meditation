import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import i18n from '../core/i18n';
import { playBreathPhaseContinuous, stopBreathPhaseContinuous, unlockAudio } from '../core/sound';
import { formatClock, ratioText } from '../core/time';
import { breathingPresets } from '../data/presets';
import { BreathingPreset, AppSettings } from '../types';
import { loadCustomBreathingPresets, saveCustomBreathingPresets } from '../core/storage';
import { StepperField } from '../components/StepperField';
import { PrimaryButton } from '../components/PrimaryButton';

interface BreathingScreenProps {
  settings: AppSettings;
}

const phaseColor: Record<string, string> = {
  inhale: '#0d6e6e',
  hold: '#2b5d89',
  exhale: '#7c4f35',
};

export const BreathingScreen = ({ settings }: BreathingScreenProps) => {
  const [allPresets, setAllPresets] = useState<BreathingPreset[]>(breathingPresets);
  const [selectedId, setSelectedId] = useState<string>(breathingPresets[0].id);
  const [inhaleSec, setInhaleSec] = useState<number>(breathingPresets[0].inhaleSec);
  const [holdSec, setHoldSec] = useState<number>(breathingPresets[0].holdSec);
  const [exhaleSec, setExhaleSec] = useState<number>(breathingPresets[0].exhaleSec);
  const [sessionMinutes, setSessionMinutes] = useState<number>(breathingPresets[0].sessionMinutes);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);

  const startRef = useRef(0);
  const phaseRef = useRef<string>('hold');

  useEffect(() => {
    loadCustomBreathingPresets().then((custom) => setAllPresets([...breathingPresets, ...custom]));
  }, []);

  useEffect(() => {
    const active = allPresets.find((p) => p.id === selectedId);
    if (!active) return;
    setInhaleSec(active.inhaleSec);
    setHoldSec(active.holdSec);
    setExhaleSec(active.exhaleSec);
    setSessionMinutes(active.sessionMinutes);
  }, [selectedId, allPresets]);

  useEffect(() => {
    if (!running) return;

    if (!startRef.current) {
      startRef.current = Date.now() - elapsedMs;
    }

    const id = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 100);

    return () => clearInterval(id);
  }, [running, elapsedMs]);

  useEffect(() => {
    return () => {
      stopBreathPhaseContinuous().catch(() => undefined);
    };
  }, []);

  const totalMs = sessionMinutes * 60 * 1000;
  const remainingSec = Math.ceil((totalMs - elapsedMs) / 1000);

  const cycleSec = Math.max(1, inhaleSec + holdSec + exhaleSec);
  const inCycle = (elapsedMs / 1000) % cycleSec;

  const currentPhase = useMemo(() => {
    if (inCycle < inhaleSec) return 'inhale';
    if (inCycle < inhaleSec + holdSec) return 'hold';
    return 'exhale';
  }, [inCycle, inhaleSec, holdSec]);

  const phaseSecondRemaining = useMemo(() => {
    if (currentPhase === 'inhale') return Math.max(1, Math.ceil(inhaleSec - inCycle));
    if (currentPhase === 'hold') return Math.max(1, Math.ceil(inhaleSec + holdSec - inCycle));
    return Math.max(1, Math.ceil(cycleSec - inCycle));
  }, [currentPhase, inhaleSec, holdSec, cycleSec, inCycle]);

  useEffect(() => {
    if (!running) {
      stopBreathPhaseContinuous().catch(() => undefined);
      phaseRef.current = 'hold';
      return;
    }

    if (elapsedMs >= totalMs) {
      stopBreathPhaseContinuous().catch(() => undefined);
      phaseRef.current = 'hold';
      return;
    }

    if (phaseRef.current === currentPhase) return;

    phaseRef.current = currentPhase;
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }

    const phaseDuration = currentPhase === 'inhale' ? inhaleSec : currentPhase === 'exhale' ? exhaleSec : holdSec;
    playBreathPhaseContinuous(settings.breathingCueSound, currentPhase, phaseDuration).catch(() => undefined);
  }, [
    running,
    elapsedMs,
    totalMs,
    currentPhase,
    inhaleSec,
    holdSec,
    exhaleSec,
    settings.breathingCueSound,
    settings.hapticsEnabled,
  ]);

  useEffect(() => {
    if (!running) return;
    if (elapsedMs >= totalMs) {
      setRunning(false);
      setElapsedMs(totalMs);
      startRef.current = 0;
      stopBreathPhaseContinuous().catch(() => undefined);
    }
  }, [elapsedMs, running, totalMs]);

  const reset = () => {
    setRunning(false);
    setElapsedMs(0);
    startRef.current = 0;
    phaseRef.current = 'hold';
    stopBreathPhaseContinuous().catch(() => undefined);
  };

  const toggleRun = async () => {
    if (running) {
      setRunning(false);
      stopBreathPhaseContinuous().catch(() => undefined);
      return;
    }
    if (elapsedMs >= totalMs) {
      setElapsedMs(0);
      startRef.current = 0;
    }
    await unlockAudio();
    setRunning(true);
  };

  const saveAsPreset = async () => {
    const custom: BreathingPreset = {
      id: `custom-${Date.now()}`,
      category: 'basic',
      name: `Custom ${ratioText(inhaleSec, holdSec, exhaleSec)}`,
      inhaleSec,
      holdSec,
      exhaleSec,
      sessionMinutes,
    };

    const builtIn = allPresets.filter((p) => !p.id.startsWith('custom-'));
    const customList = allPresets.filter((p) => p.id.startsWith('custom-')).concat(custom);
    await saveCustomBreathingPresets(customList);
    setAllPresets([...builtIn, ...customList]);
    setSelectedId(custom.id);
    Alert.alert('Saved', settings.locale === 'hr' ? 'Predlozak je spremljen.' : 'Preset saved.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{settings.locale === 'hr' ? 'Timer disanja' : 'Breathing Timer'}</Text>
      <Text style={styles.subtitle}>{settings.locale === 'hr' ? 'Omjer' : 'Ratio'}: {ratioText(inhaleSec, holdSec, exhaleSec)}</Text>

      <View style={styles.phaseCard}>
        <Text style={[styles.phaseName, { color: phaseColor[currentPhase] }]}>{i18n.t(`phase.${currentPhase}`)}</Text>
        <Text style={styles.phaseTime}>{phaseSecondRemaining}s</Text>
        <Text style={styles.clock}>{formatClock(remainingSec)}</Text>
      </View>

      <View style={styles.actionsRow}>
        <PrimaryButton label={running ? i18n.t('common.pause') : elapsedMs > 0 ? i18n.t('common.resume') : i18n.t('common.start')} onPress={toggleRun} />
        <PrimaryButton label={i18n.t('common.reset')} onPress={reset} variant="secondary" />
      </View>

      <View style={styles.presetBlock}>
        <Text style={styles.blockTitle}>{settings.locale === 'hr' ? 'Predlosci' : 'Presets'}</Text>
        <View style={styles.chips}>
          {allPresets.map((p) => (
            <Text
              key={p.id}
              style={[styles.chip, p.id === selectedId && styles.chipActive]}
              onPress={() => {
                setSelectedId(p.id);
                reset();
              }}
            >
              {p.name}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <StepperField label={settings.locale === 'hr' ? 'Udah' : 'Inhale'} value={inhaleSec} onChange={setInhaleSec} min={1} max={30} />
        <StepperField label={settings.locale === 'hr' ? 'Zadrzi' : 'Hold'} value={holdSec} onChange={setHoldSec} min={0} max={60} />
        <StepperField label={settings.locale === 'hr' ? 'Izdah' : 'Exhale'} value={exhaleSec} onChange={setExhaleSec} min={1} max={30} />
        <StepperField label={settings.locale === 'hr' ? 'Trajanje (min)' : 'Session (min)'} value={sessionMinutes} onChange={setSessionMinutes} min={1} max={60} />
        <PrimaryButton label={settings.locale === 'hr' ? 'Spremi predlozak' : 'Save Preset'} onPress={saveAsPreset} variant="secondary" />
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
  phaseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  phaseName: {
    fontSize: 34,
    fontWeight: '800',
  },
  phaseTime: {
    fontSize: 64,
    fontWeight: '800',
    color: '#122020',
    marginTop: 4,
  },
  clock: {
    marginTop: 6,
    fontSize: 24,
    color: '#3d5959',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  presetBlock: {
    marginBottom: 12,
  },
  blockTitle: {
    fontSize: 18,
    color: '#122020',
    marginBottom: 8,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    gap: 6,
  },
});
