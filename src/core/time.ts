export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const formatClock = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const ss = (safe % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

export const ratioText = (inhale: number, hold: number, exhale: number): string => {
  return `${inhale}:${hold}:${exhale}`;
};
