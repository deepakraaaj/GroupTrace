import { useCallback } from 'react';
import { triggerHaptic, setHapticsMuted } from '../services/hapticFeedback';
import { useAppStore } from '../stores/appStore';
import type { HapticEvent } from '../types';

export function useHaptics() {
  const isAlertsMuted    = useAppStore((s) => s.isAlertsMuted);
  const alertPreference  = useAppStore((s) => s.alertPreference);
  const myPosition       = useAppStore((s) => s.myPosition);

  const fire = useCallback(
    async (event: HapticEvent) => {
      if (alertPreference === 'silent') return;

      // Adaptive: speed > 40 km/h → haptic only (no visual/voice from caller)
      const speedKmh = myPosition?.speed != null ? myPosition.speed * 3.6 : 0;

      // Urgent always fires even at low battery (caller restricts non-urgent)
      if (isAlertsMuted && event !== 'urgent') return;

      // Suppress non-urgent when battery is low (battery API best-effort)
      if (event !== 'urgent' && event !== 'confirmed') {
        const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number }> };
        if (nav.getBattery) {
          try {
            const battery = await nav.getBattery();
            if (battery.level < 0.15) return;
          } catch { /* not supported */ }
        }
      }

      setHapticsMuted(false);
      await triggerHaptic(event);

      // Suppress during high-speed riding (haptic fires but no visual/voice — handled by caller)
      void speedKmh;
    },
    [isAlertsMuted, alertPreference, myPosition]
  );

  return { fire };
}
