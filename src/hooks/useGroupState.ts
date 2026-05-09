import { useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import type { MemberLocation, GroupContext } from '../types';
import { msToKmh } from '../utils/math';
import { SPEED_NO_VISUAL_KMH } from '../utils/contextDefaults';

/** Derived, memoised selectors over the live GroupState */
export function useGroupState() {
  const groupState  = useAppStore((s) => s.groupState);
  const myPosition  = useAppStore((s) => s.myPosition);
  const activeRoom = useAppStore((s) => s.activeRoom);

  const context: GroupContext | null = activeRoom?.context ?? null;

  const separatedMembers = useMemo<MemberLocation[]>(
    () => groupState?.separatedMembers ?? [],
    [groupState?.separatedMembers]
  );

  const riderCount = groupState?.riderCount ?? 0;
  const separatedCount = groupState?.separatedCount ?? 0;
  const avgSpeedKmh = groupState?.avgSpeedKmh ?? 0;

  const mySpeedKmh = useMemo(
    () => (myPosition?.speed != null ? msToKmh(myPosition.speed) : 0),
    [myPosition?.speed]
  );

  // Adaptive quiet: above 40 km/h no visual alerts
  const suppressVisual = mySpeedKmh > SPEED_NO_VISUAL_KMH;

  // Is group fully together?
  const allTogether = separatedCount === 0 && riderCount > 0;

  // Slowest member (trekking / pilgrimage emphasis)
  const slowestMember = useMemo<MemberLocation | null>(() => {
    if (!groupState?.members.length) return null;
    return groupState.members.reduce((slowest, m) => {
      const s = m.speed ?? 0;
      const cs = slowest.speed ?? 0;
      return s < cs ? m : slowest;
    });
  }, [groupState?.members]);

  // Convoy car order: sorted by heading proximity to center
  const orderedConvoyMembers = useMemo<MemberLocation[]>(() => {
    if (context !== 'convoy' || !groupState?.members) return [];
    return [...groupState.members].sort((a, b) => {
      // Sort by distance from center ascending (lead car closest)
      return a.distanceFromCenter - b.distanceFromCenter;
    });
  }, [context, groupState?.members]);

  // Headcount for pilgrimage / tour_guide
  const headcountPresent = riderCount - separatedCount;

  const members = useMemo<MemberLocation[]>(
    () => groupState?.members ?? [],
    [groupState?.members]
  );

  return {
    groupState,
    members,
    separatedMembers,
    riderCount,
    separatedCount,
    avgSpeedKmh,
    mySpeedKmh,
    suppressVisual,
    allTogether,
    slowestMember,
    orderedConvoyMembers,
    headcountPresent,
    context,
  };
}
