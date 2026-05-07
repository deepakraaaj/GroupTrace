import type { HapticEvent, HapticPulse } from '../types';

export const HAPTIC_PATTERNS: Record<HapticEvent, HapticPulse[]> = {
  // 3 light pulses 100 ms apart
  allGood: [
    { duration: 80,  intensity: 'light', pause: 100 },
    { duration: 80,  intensity: 'light', pause: 100 },
    { duration: 80,  intensity: 'light', pause: 0   },
  ],
  // 1 heavy pulse 300 ms
  separated: [
    { duration: 300, intensity: 'heavy', pause: 0 },
  ],
  // 2 medium pulses 150 ms apart
  newMessage: [
    { duration: 120, intensity: 'medium', pause: 150 },
    { duration: 120, intensity: 'medium', pause: 0   },
  ],
  // 5 rapid vibrations 50 ms apart
  urgent: [
    { duration: 80,  intensity: 'heavy', pause: 50 },
    { duration: 80,  intensity: 'heavy', pause: 50 },
    { duration: 80,  intensity: 'heavy', pause: 50 },
    { duration: 80,  intensity: 'heavy', pause: 50 },
    { duration: 80,  intensity: 'heavy', pause: 0  },
  ],
  // 1 light + 1 heavy (action acknowledged)
  confirmed: [
    { duration: 80,  intensity: 'light', pause: 120 },
    { duration: 200, intensity: 'heavy', pause: 0   },
  ],
};
