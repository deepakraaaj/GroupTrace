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
import { Capacitor } from '@capacitor/core';
import { haversineMeters, secondsSince } from '../utils/math';
import { broadcastLocation } from './locationBroadcast';
import type { RawPosition, GroupSettings, PrivacyMode } from '../types';
import {
  STATIONARY_THRESHOLD_SECONDS,
  STATIONARY_POLL_MULTIPLIER,
} from '../utils/contextDefaults';

const IS_WEB = !Capacitor.isNativePlatform();

type OnPositionUpdate = (pos: RawPosition) => void;
type OnSyncFired     = (pos: RawPosition) => void;

interface GeoSyncConfig {
  roomId:   string;
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
  webWatchId:        number | null;  // browser navigator.geolocation watch id
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
  webWatchId:        null,
  isPaused:          false,
  pauseTimer:        null,
};

export async function startTracking(config: GeoSyncConfig): Promise<void> {
  if (_syncState.watchId || _syncState.webWatchId !== null) {
    await stopTracking();
  }

  _config = config;
  _syncState = {
    lastSyncPosition:  null,
    lastSyncTime:      0,
    lastMovedTime:     Date.now(),
    watchId:           null,
    webWatchId:        null,
    isPaused:          false,
    pauseTimer:        null,
  };

  console.log('[GeoSync] Platform:', IS_WEB ? 'web' : 'native');

  if (IS_WEB) {
    // Use browser's native geolocation API on web
    if (!('geolocation' in navigator)) {
      const err = new Error('Geolocation is not supported in this browser');
      console.error('[GeoSync]', err.message);
      throw err;
    }

    console.log('[GeoSync] Starting browser watchPosition (will prompt for permission)...');

    const webWatchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log('[GeoSync] 📍 Raw browser geolocation response:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        });

        const raw: RawPosition = {
          lat:       position.coords.latitude,
          lng:       position.coords.longitude,
          accuracy:  position.coords.accuracy,
          speed:     position.coords.speed,
          heading:   position.coords.heading,
          timestamp: position.timestamp,
        };

        console.log('[GeoSync] ✅ Converted to RawPosition:', {
          lat: raw.lat.toFixed(6),
          lng: raw.lng.toFixed(6),
          accuracy: raw.accuracy,
        });

        handlePositionUpdate(raw);
      },
      (err) => {
        console.error('[GeoSync] ❌ Browser geolocation error:', {
          code: err.code,
          message: err.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout:            30_000, // Increased from 10s to 30s
        maximumAge:         0, // Don't use cached position
      }
    );

    _syncState.webWatchId = webWatchId;
    console.log('[GeoSync] Browser watch started, id:', webWatchId);
    return;
  }

  // Native platform — use Capacitor
  try {
    console.log('[GeoSync] Requesting native location permissions...');
    await Geolocation.requestPermissions();
    console.log('[GeoSync] Native location permissions granted');
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
    console.log('[GeoSync] Starting native watch position...');
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10_000 },
      callback
    );
    _syncState.watchId = id;
    console.log('[GeoSync] Native watch position started with ID:', id);
  } catch (err) {
    console.error('[GeoSync] Failed to start watch position:', err);
    throw err;
  }
}

export async function stopTracking(): Promise<void> {
  if (_syncState.webWatchId !== null) {
    navigator.geolocation.clearWatch(_syncState.webWatchId);
    _syncState.webWatchId = null;
  }
  if (_syncState.watchId) {
    try {
      await Geolocation.clearWatch({ id: _syncState.watchId });
    } catch (err) {
      console.warn('[GeoSync] Error clearing native watch:', err);
    }
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

  console.log('[GeoSync] 📊 Position update received:', {
    lat: pos.lat.toFixed(6),
    lng: pos.lng.toFixed(6),
    accuracy: pos.accuracy?.toFixed(1),
    timestamp: new Date(pos.timestamp).toISOString(),
  });

  // Always update local UI state regardless of sync threshold
  _config.onPositionUpdate(pos);

  if (_syncState.isPaused) {
    console.log('[GeoSync] ⏸️ Tracking paused');
    return;
  }

  // Anonymous privacy mode: never push to backend
  if (_config.privacy === 'anonymous') {
    console.log('[GeoSync] 🔒 Privacy mode: anonymous (not broadcasting)');
    return;
  }

  const shouldSync = checkSyncThreshold(pos);
  if (shouldSync) {
    console.log('[GeoSync] 🔄 Sync threshold met, broadcasting to server');
    fireSync(pos);
  } else {
    console.log('[GeoSync] ⏭️ Sync threshold not met, skipping broadcast');
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

  broadcastLocation(_config.roomId, _config.userId, pos).catch(() => {
    // broadcastLocation already enqueues on failure — nothing extra needed
  });
}

export function getIsTracking(): boolean {
  return _syncState.watchId !== null || _syncState.webWatchId !== null;
}

export function getIsPaused(): boolean {
  return _syncState.isPaused;
}
