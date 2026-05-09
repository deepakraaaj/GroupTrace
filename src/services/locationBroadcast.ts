import { supabase } from './supabaseClient';
import { enqueueLocation } from './offlineQueue';
import type { RawPosition } from '../types';

function validateCoordinates(lat: number, lng: number): { valid: boolean; error?: string } {
  // Latitude: -90 to 90
  if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
    return { valid: false, error: `Invalid latitude: ${lat}` };
  }
  // Longitude: -180 to 180
  if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
    return { valid: false, error: `Invalid longitude: ${lng}` };
  }
  // Both can't be zero (that's the null island)
  if (lat === 0 && lng === 0) {
    return { valid: false, error: 'Both coordinates are zero (null island)' };
  }
  return { valid: true };
}

export async function broadcastLocation(
  roomId: string,
  userId: string,
  position: RawPosition
): Promise<void> {
  try {
    // Validate coordinates before sending
    const validation = validateCoordinates(position.lat, position.lng);
    if (!validation.valid) {
      console.error('[LocationBroadcast] ❌ Coordinate validation failed:', validation.error);
      console.error('[LocationBroadcast] Raw position:', position);
      throw new Error(validation.error);
    }

    console.log('[LocationBroadcast] ✅ Coordinate validation passed. Broadcasting:', {
      lat: position.lat.toFixed(6),
      lng: position.lng.toFixed(6),
      accuracy: position.accuracy,
    });

    // Upsert location (one row per user per room)
    const { error: upsertError } = await supabase
      .from('room_locations')
      .upsert({
        room_id:   roomId,
        user_id:   userId,
        latitude:  position.lat,
        longitude: position.lng,
        accuracy:  position.accuracy,
        speed:     position.speed,
        heading:   position.heading,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'room_id,user_id' });

    if (upsertError) {
      console.error('[LocationBroadcast] Upsert error:', upsertError);
      throw upsertError;
    }

    // Update last_seen_at on room_members (best-effort, non-blocking)
    supabase
      .from('room_members')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.warn('[LocationBroadcast] last_seen update failed:', error);
      });

    console.log('[LocationBroadcast] ✅ Location synced:', {
      lat: position.lat.toFixed(6),
      lng: position.lng.toFixed(6),
    });
  } catch (err) {
    console.error('[LocationBroadcast] ❌ Failed to sync location:', err);
    // Network unavailable — store locally for later flush
    await enqueueLocation(roomId, userId, position);
  }
}
