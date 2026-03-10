import { Pressable, StyleSheet, Text, View } from 'react-native';
import { clamp } from '../core/time';

interface StepperFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const StepperField = ({
  label,
  value,
  onChange,
  min = 0,
  max = 120,
}: StepperFieldProps) => {
  const decrease = () => onChange(clamp(value - 1, min, max));
  const increase = () => onChange(clamp(value + 1, min, max));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" onPress={decrease} style={styles.controlBtn}>
          <Text style={styles.controlText}>-</Text>
        </Pressable>
        <Text style={styles.value}>{value}s</Text>
        <Pressable accessibilityRole="button" onPress={increase} style={styles.controlBtn}>
          <Text style={styles.controlText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#1e2a2a',
    marginBottom: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ebf5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    fontSize: 26,
    color: '#0d6e6e',
    fontWeight: '700',
    marginTop: -1,
  },
  value: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 18,
    color: '#122020',
    fontWeight: '700',
  },
});
