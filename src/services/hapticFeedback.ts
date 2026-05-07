import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { HAPTIC_PATTERNS } from '../utils/hapticPatterns';
import type { HapticEvent, HapticPulse } from '../types';

function impactStyle(intensity: HapticPulse['intensity']): ImpactStyle {
  switch (intensity) {
    case 'light':  return ImpactStyle.Light;
    case 'medium': return ImpactStyle.Medium;
    case 'heavy':  return ImpactStyle.Heavy;
  }
}

async function playPulse(pulse: HapticPulse): Promise<void> {
  await Haptics.impact({ style: impactStyle(pulse.intensity) });
  if (pulse.pause > 0) {
    await new Promise<void>((r) => setTimeout(r, pulse.duration + pulse.pause));
  }
}

let _muted = false;

export function setHapticsMuted(muted: boolean): void {
  _muted = muted;
}

export async function triggerHaptic(event: HapticEvent): Promise<void> {
  if (_muted) return;

  const pattern = HAPTIC_PATTERNS[event];
  for (const pulse of pattern) {
    await playPulse(pulse);
  }
}

export async function vibrate(durationMs: number): Promise<void> {
  if (_muted) return;
  await Haptics.vibrate({ duration: durationMs });
}
