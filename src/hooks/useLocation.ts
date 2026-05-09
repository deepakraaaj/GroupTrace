import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import {
  startTracking,
  stopTracking,
  pauseTracking,
  resumeTracking,
  updatePrivacy,
} from '../services/geoSync';
import type { RawPosition } from '../types';

export function useLocation() {
  const activeRoom    = useAppStore((s) => s.activeRoom);
  const user          = useAppStore((s) => s.user);
  const rideSetup     = useAppStore((s) => s.rideSetup);
  const setMyPosition = useAppStore((s) => s.setMyPosition);
  const setIsTracking = useAppStore((s) => s.setIsTracking);
  const setIsPaused   = useAppStore((s) => s.setIsPaused);
  const setGroupState = useAppStore((s) => s.setGroupState);
  const groupState    = useAppStore((s) => s.groupState);

  const onPositionUpdate = useCallback((pos: RawPosition) => {
    setMyPosition(pos);
  }, [setMyPosition]);

  const onSyncFired = useCallback((_pos: RawPosition) => {
    // Sync fired — group state recomputation is triggered via realtime subscription
    // Nothing additional needed here
  }, []);

  useEffect(() => {
    if (!activeRoom || !user) return;

    startTracking({
      roomId:   activeRoom.id,
      userId:   user.id,
      settings: activeRoom.settings,
      privacy:  rideSetup.privacyMode,
      onPositionUpdate,
      onSyncFired,
    }).then(() => setIsTracking(true));

    return () => {
      stopTracking().then(() => setIsTracking(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.id, user?.id]);

  // When privacy mode changes mid-ride, propagate immediately
  useEffect(() => {
    updatePrivacy(rideSetup.privacyMode);
  }, [rideSetup.privacyMode]);

  const pause5Min = useCallback(() => {
    pauseTracking(5 * 60 * 1000);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5 * 60 * 1000);
  }, [setIsPaused]);

  const resume = useCallback(() => {
    resumeTracking();
    setIsPaused(false);
  }, [setIsPaused]);

  const stop = useCallback(async () => {
    await stopTracking();
    setIsTracking(false);
    setIsPaused(false);
  }, [setIsTracking, setIsPaused]);

  return { pause5Min, resume, stop, groupState };
}
