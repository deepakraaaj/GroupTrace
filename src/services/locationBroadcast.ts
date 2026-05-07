import { supabase } from './supabaseClient';
import { enqueueLocation } from './offlineQueue';
import type { RawPosition } from '../types';

export async function broadcastLocation(
  groupId: string,
  userId: string,
  position: RawPosition
): Promise<void> {
  try {
    const { error } = await supabase.rpc('sync_location', {
      p_group_id: groupId,
      p_user_id:  userId,
      p_lat:      position.lat,
      p_lng:      position.lng,
      p_accuracy: position.accuracy,
      p_speed:    position.speed,
      p_heading:  position.heading,
    });

    if (error) {
      console.error('[LocationBroadcast] sync_location RPC error:', error);
      throw error;
    }
    console.log('[LocationBroadcast] Location synced:', { lat: position.lat, lng: position.lng });
  } catch (err) {
    console.error('[LocationBroadcast] Failed to sync location:', err);
    // Network unavailable — store locally for later flush
    await enqueueLocation(groupId, userId, position);
  }
}
