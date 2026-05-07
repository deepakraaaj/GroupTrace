import { supabase } from './supabaseClient';
import { enqueueLocation } from './offlineQueue';
import type { RawPosition } from '../types';

export async function broadcastLocation(
  groupId: string,
  userId: string,
  position: RawPosition
): Promise<void> {
  try {
    // Direct insert into group_locations — no RPC needed
    const { error: insertError } = await supabase
      .from('group_locations')
      .insert({
        group_id:  groupId,
        user_id:   userId,
        latitude:  position.lat,
        longitude: position.lng,
        accuracy:  position.accuracy,
        speed:     position.speed,
        heading:   position.heading,
      });

    if (insertError) {
      console.error('[LocationBroadcast] Insert error:', insertError);
      throw insertError;
    }

    // Update last_seen_at on group_members (best-effort, non-blocking)
    supabase
      .from('group_members')
      .update({ last_seen_at: new Date().toISOString(), is_active: true })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.warn('[LocationBroadcast] last_seen update failed:', error);
      });

    console.log('[LocationBroadcast] Location synced:', { lat: position.lat, lng: position.lng });
  } catch (err) {
    console.error('[LocationBroadcast] Failed to sync location:', err);
    // Network unavailable — store locally for later flush
    await enqueueLocation(groupId, userId, position);
  }
}
