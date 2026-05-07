import { useState, useCallback, useEffect } from 'react';
import {
  startListening,
  stopListening,
  speak,
  processTranscript,
  registerCommands,
  buildDefaultCommands,
} from '../services/voiceControl';
import { useAppStore } from '../stores/appStore';
import type { VoiceState } from '../types';
import { haversineMeters } from '../utils/math';

export function useVoice() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [lastTranscript, setLastTranscript] = useState('');

  const groupState    = useAppStore((s) => s.groupState);
  const activeGroup   = useAppStore((s) => s.activeGroup);
  const activeTrip    = useAppStore((s) => s.activeTrip);
  const myPosition    = useAppStore((s) => s.myPosition);
  const alertPref     = useAppStore((s) => s.alertPreference);
  const addMessage    = useAppStore((s) => s.addMessage);
  const user          = useAppStore((s) => s.user);
  const setIsTracking = useAppStore((s) => s.setIsTracking);

  // Re-register commands whenever group state changes
  useEffect(() => {
    const commands = buildDefaultCommands({
      getMembers: () => groupState?.members.map((m) => ({
        displayName:         m.displayName,
        distanceFromCenter:  m.distanceFromCenter,
        timestamp:           m.timestamp,
      })) ?? [],
      getTotalCount:        () => groupState?.riderCount ?? 0,
      getSeparatedCount:    () => groupState?.separatedCount ?? 0,
      getDestinationName:   () => activeTrip?.destinationName ?? null,
      getDestinationDistanceM: () => {
        if (!activeTrip?.destinationLat || !myPosition) return null;
        return haversineMeters(
          myPosition.lat, myPosition.lng,
          activeTrip.destinationLat!, activeTrip.destinationLng!
        );
      },
      getCurrentSpeedMs: () => myPosition?.speed ?? null,
      sendPreset: (msg) => {
        if (!user || !activeGroup) return;
        addMessage({
          id:           `local-${Date.now()}`,
          group_id:     activeGroup.id,
          user_id:      user.id,
          message:      msg,
          message_type: 'preset',
          created_at:   new Date().toISOString(),
        });
      },
      stopTracking: () => setIsTracking(false),
      dropPin: () => {
        // Handled via global event so map layer can react
        window.dispatchEvent(new CustomEvent('grouptrace:droppin'));
      },
    });
    registerCommands(commands);
  }, [groupState, activeTrip, myPosition, user, activeGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  const listen = useCallback(async () => {
    if (voiceState !== 'idle') return;
    setVoiceState('listening');

    await startListening(
      async (transcript) => {
        setLastTranscript(transcript);
        setVoiceState('processing');

        const response = await processTranscript(transcript);
        if (response) {
          setVoiceState('speaking');
          if (alertPref !== 'silent') {
            await speak(response);
          }
        }
        setVoiceState('idle');
      },
      () => setVoiceState('error')
    );
  }, [voiceState, alertPref]);

  const cancel = useCallback(async () => {
    await stopListening();
    setVoiceState('idle');
  }, []);

  return { voiceState, lastTranscript, listen, cancel };
}
