import type { GroupContext, GroupSettings } from '../types';

export const CONTEXT_DEFAULTS: Record<GroupContext, GroupSettings> = {
  biker: {
    separationThresholdMeters: 500,
    syncThresholdMeters: 50,
    syncThresholdSeconds: 60,
    ridingSpeedKmh: 30,
    stoppedSpeedKmh: 5,
  },
  trekking: {
    separationThresholdMeters: 200,
    syncThresholdMeters: 30,
    syncThresholdSeconds: 45,
    walkingSpeedKmh: 3,
    restingSpeedKmh: 0.5,
  },
  convoy: {
    separationThresholdMeters: 2000,
    syncThresholdMeters: 100,
    syncThresholdSeconds: 30,
    highwaySpeedKmh: 60,
    citySpeedKmh: 10,
    missedTurnHeadingDegrees: 30,
  },
  pilgrimage: {
    separationThresholdMeters: 300,
    syncThresholdMeters: 40,
    syncThresholdSeconds: 90,
    maxGroupSize: 100,
  },
  family: {
    separationThresholdMeters: 100,
    syncThresholdMeters: 20,
    syncThresholdSeconds: 30,
  },
  delivery: {
    separationThresholdMeters: 99999,
    syncThresholdMeters: 200,
    syncThresholdSeconds: 120,
    stationaryAlertMinutes: 10,
  },
  tour_guide: {
    separationThresholdMeters: 150,
    syncThresholdMeters: 30,
    syncThresholdSeconds: 45,
  },
};

export function getContextDefaults(context: GroupContext): GroupSettings {
  return { ...CONTEXT_DEFAULTS[context] };
}

/** Merge user/organizer overrides on top of context defaults */
export function mergeSettings(
  context: GroupContext,
  overrides: Partial<GroupSettings>
): GroupSettings {
  return { ...CONTEXT_DEFAULTS[context], ...overrides };
}

/** True when delivery context (separation concept doesn't apply) */
export function isDeliveryContext(context: GroupContext): boolean {
  return context === 'delivery';
}

/** True for contexts where children/members need tighter proximity checks */
export function isHighAlertContext(context: GroupContext): boolean {
  return context === 'family' || context === 'tour_guide';
}

// Adaptive GPS poll rate reduction: when stationary > 5 min, halve the threshold
export const STATIONARY_THRESHOLD_SECONDS = 300;
export const STATIONARY_POLL_MULTIPLIER = 2; // multiply sync interval by this

// Adaptive quiet rules
export const SPEED_NO_VISUAL_KMH = 40;       // haptic only above this
export const BATTERY_LOW_PERCENT = 15;        // only urgent haptics below this
export const OFFLINE_LABEL_THRESHOLD_MS = 5 * 60 * 1000; // 5 min = show "last seen"
