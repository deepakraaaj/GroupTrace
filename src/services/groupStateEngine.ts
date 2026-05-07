/**
 * Client-side group state computation.
 * Runs on every realtime location update; uses memoised inputs
 * to avoid unnecessary recomputation.
 */

import { haversineMeters, centerPoint, msToKmh } from '../utils/math';
import { OFFLINE_LABEL_THRESHOLD_MS } from '../utils/contextDefaults';
import type {
  MemberLocation,
  GroupState,
  GroupSettings,
  GroupContext,
  MemberRole,
  MemberStatus,
  DbGroupLocation,
  DbUser,
} from '../types';

export interface RawMemberData {
  location: DbGroupLocation;
  user: DbUser;
  role: MemberRole;
}

export function computeGroupState(
  members: RawMemberData[],
  settings: GroupSettings,
  _context: GroupContext
): GroupState {
  if (members.length === 0) {
    return {
      centerLat: null,
      centerLng: null,
      riderCount: 0,
      separatedCount: 0,
      avgSpeedKmh: 0,
      members: [],
      separatedMembers: [],
      computedAt: Date.now(),
    };
  }

  const points = members.map((m) => ({
    lat: m.location.latitude,
    lng: m.location.longitude,
  }));

  const center = centerPoint(points)!;

  const enriched: MemberLocation[] = members.map((m) => {
    const distFromCenter = haversineMeters(
      center.lat, center.lng,
      m.location.latitude, m.location.longitude
    );

    const status: MemberStatus = computeMemberStatus(
      distFromCenter,
      settings.separationThresholdMeters,
      m.location.timestamp
    );

    return {
      userId:            m.user.id,
      displayName:       m.user.display_name,
      avatarColor:       m.user.avatar_color,
      role:              m.role,
      lat:               m.location.latitude,
      lng:               m.location.longitude,
      speed:             m.location.speed,
      heading:           m.location.heading,
      accuracy:          m.location.accuracy,
      timestamp:         new Date(m.location.timestamp).getTime(),
      status,
      distanceFromCenter: distFromCenter,
    };
  });

  const separated = enriched.filter((m) => m.status === 'separated');

  const speeds = enriched
    .map((m) => m.speed)
    .filter((s): s is number => s !== null);
  const avgSpeedKmh =
    speeds.length > 0
      ? msToKmh(speeds.reduce((a, b) => a + b, 0) / speeds.length)
      : 0;

  return {
    centerLat:       center.lat,
    centerLng:       center.lng,
    riderCount:      enriched.length,
    separatedCount:  separated.length,
    avgSpeedKmh:     Math.round(avgSpeedKmh * 10) / 10,
    members:         enriched,
    separatedMembers: separated,
    computedAt:      Date.now(),
  };
}

function computeMemberStatus(
  distFromCenter: number,
  threshold: number,
  isoTimestamp: string
): MemberStatus {
  const age = Date.now() - new Date(isoTimestamp).getTime();

  if (age > OFFLINE_LABEL_THRESHOLD_MS) return 'offline';
  if (distFromCenter > threshold) return 'separated';
  if (distFromCenter > threshold * 0.7) return 'slow';
  return 'together';
}

/** Derive delivery status from speed + time since last update */
export function computeDeliveryStatus(
  speedMs: number | null,
  lastSeenMs: number,
  stationaryAlertMinutes: number
): import('../types').DeliveryStatus {
  const offlineMs = OFFLINE_LABEL_THRESHOLD_MS;
  const age = Date.now() - lastSeenMs;

  if (age > offlineMs) return 'delayed';

  const stationaryMs = stationaryAlertMinutes * 60 * 1000;
  const isStationary = speedMs !== null && speedMs < 0.5;
  if (isStationary && age > stationaryMs) return 'delayed';

  return 'en_route';
}
