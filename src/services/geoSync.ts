/**
 * GeoSync Engine — the core battery-efficient location engine.
 *
 * Principle: GPS events fire continuously from Capacitor, but we only
 * push to the backend when the perimeter threshold is crossed (distance
 * OR time), preventing unnecessary network calls.
 *
 * Local Zustand state is always updated immediately for a live UI.
 * Backend pushes are rate-limited by the group's context settings.
 */

import { Geolocation, type WatchPositionCallback } from '@capacitor/geolocation';
import { haversineMeters, secondsSince } from '../utils/math';
import { broadcastLocation } from './locationBroadcast';
import type { RawPosition, GroupSettings, PrivacyMode } from '../types';
import {
  STATIONARY_THRESHOLD_SECONDS,
  STATIONARY_POLL_MULTIPLIER,
} from '../utils/contextDefaults';

type OnPositionUpdate = (pos: RawPosition) => void;
type OnSyncFired     = (pos: RawPosition) => void;

interface GeoSyncConfig {
  groupId:  string;
  userId:   string;
  settings: GroupSettings;
  privacy:  PrivacyMode;
  onPositionUpdate: OnPositionUpdate;
  onSyncFired:      OnSyncFired;
}

interface SyncState {
  lastSyncPosition:  RawPosition | null;
  lastSyncTime:      number;
  lastMovedTime:     number;  // for stationary detection
  watchId:           string | null;
  isPaused:          boolean;
  pauseTimer:        ReturnType<typeof setTimeout> | null;
}

// Module-level singleton — only one tracking session at a time
let _config:    GeoSyncConfig | null = null;
let _syncState: SyncState = {
  lastSyncPosition:  null,
  lastSyncTime:      0,
  lastMovedTime:     Date.now(),
  watchId:           null,
  isPaused:          false,
  pauseTimer:        null,
};

export async function startTracking(config: GeoSyncConfig): Promise<void> {
  if (_syncState.watchId) {
    await stopTracking();
  }

  _config = config;
  _syncState = {
    lastSyncPosition:  null,
    lastSyncTime:      0,
    lastMovedTime:     Date.now(),
    watchId:           null,
    isPaused:          false,
    pauseTimer:        null,
  };

  try {
    console.log('[GeoSync] Requesting location permissions...');
    await Geolocation.requestPermissions();
    console.log('[GeoSync] Location permissions granted');
  } catch (err) {
    console.error('[GeoSync] Failed to request permissions:', err);
    throw err;
  }

  const callback: WatchPositionCallback = (position, err) => {
    if (err) {
      console.error('[GeoSync] Watch position error:', err);
      return;
    }
    if (!position) {
      console.warn('[GeoSync] Watch position returned null');
      return;
    }

    const raw: RawPosition = {
      lat:       position.coords.latitude,
      lng:       position.coords.longitude,
      accuracy:  position.coords.accuracy,
      speed:     position.coords.speed,
      heading:   position.coords.heading,
      timestamp: position.timestamp,
    };

    handlePositionUpdate(raw);
  };

  try {
    console.log('[GeoSync] Starting watch position...');
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10_000 },
      callback
    );
    _syncState.watchId = id;
    console.log('[GeoSync] Watch position started with ID:', id);
  } catch (err) {
    console.error('[GeoSync] Failed to start watch position:', err);
    throw err;
  }
}

export async function stopTracking(): Promise<void> {
  if (_syncState.watchId) {
    await Geolocation.clearWatch({ id: _syncState.watchId });
    _syncState.watchId = null;
  }
  if (_syncState.pauseTimer) {
    clearTimeout(_syncState.pauseTimer);
    _syncState.pauseTimer = null;
  }
  _config = null;
}

export function pauseTracking(durationMs: number): void {
  if (!_config) return;
  _syncState.isPaused = true;

  if (_syncState.pauseTimer) clearTimeout(_syncState.pauseTimer);
  _syncState.pauseTimer = setTimeout(() => {
    _syncState.isPaused = false;
    _syncState.pauseTimer = null;
  }, durationMs);
}

export function resumeTracking(): void {
  _syncState.isPaused = false;
  if (_syncState.pauseTimer) {
    clearTimeout(_syncState.pauseTimer);
    _syncState.pauseTimer = null;
  }
}

export function updateSettings(settings: GroupSettings): void {
  if (_config) _config.settings = settings;
}

export function updatePrivacy(privacy: PrivacyMode): void {
  if (_config) _config.privacy = privacy;
}

function handlePositionUpdate(pos: RawPosition): void {
  if (!_config) return;

  console.log('[GeoSync] Position update:', { lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy });

  // Always update local UI state regardless of sync threshold
  _config.onPositionUpdate(pos);

  if (_syncState.isPaused) {
    console.log('[GeoSync] Tracking paused');
    return;
  }

  // Anonymous privacy mode: never push to backend
  if (_config.privacy === 'anonymous') {
    console.log('[GeoSync] Privacy mode: anonymous');
    return;
  }

  const shouldSync = checkSyncThreshold(pos);
  if (shouldSync) {
    console.log('[GeoSync] Sync threshold met, firing sync');
    fireSync(pos);
  }
}

function checkSyncThreshold(pos: RawPosition): boolean {
  if (!_config) return false;

  const { settings } = _config;
  const { lastSyncPosition, lastSyncTime } = _syncState;

  // Detect stationary — double the threshold to save battery
  const isStationary =
    secondsSince(_syncState.lastMovedTime) > STATIONARY_THRESHOLD_SECONDS;
  const effectiveMeters  = isStationary
    ? settings.syncThresholdMeters * STATIONARY_POLL_MULTIPLIER
    : settings.syncThresholdMeters;
  const effectiveSeconds = isStationary
    ? settings.syncThresholdSeconds * STATIONARY_POLL_MULTIPLIER
    : settings.syncThresholdSeconds;

  if (!lastSyncPosition) return true; // first fix always syncs

  const distMoved = haversineMeters(
    lastSyncPosition.lat, lastSyncPosition.lng,
    pos.lat, pos.lng
  );

  const timeSinceSync = (pos.timestamp - lastSyncTime) / 1000;

  // Update lastMovedTime when we detect meaningful movement
  if (distMoved > 5) {
    _syncState.lastMovedTime = Date.now();
  }

  return distMoved >= effectiveMeters || timeSinceSync >= effectiveSeconds;
}

function fireSync(pos: RawPosition): void {
  if (!_config) return;

  _syncState.lastSyncPosition = pos;
  _syncState.lastSyncTime     = pos.timestamp;

  _config.onSyncFired(pos);

  broadcastLocation(_config.groupId, _config.userId, pos).catch(() => {
    // broadcastLocation already enqueues on failure — nothing extra needed
  });
}

export function getIsTracking(): boolean {
  return _syncState.watchId !== null;
}

export function getIsPaused(): boolean {
  return _syncState.isPaused;
}
