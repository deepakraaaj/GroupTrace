import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { computeGroupState, type RawMemberData } from '../services/groupStateEngine';
import { flushQueue, getQueueLength } from '../services/offlineQueue';
import { useAppStore } from '../stores/appStore';
import type {
  DbRoomLocation,
  DbRoomMember,
  DbGroupMessage,
  DbGroupPin,
  MemberRole,
} from '../types';

/**
 * Subscribes to a single per-group Supabase Realtime channel.
 * Handles: locations, messages, pins, member status.
 * Recomputes group state on every location event (client-side, no extra RPC).
 */
export function useGroupRealtime() {
  const activeRoom    = useAppStore((s) => s.activeRoom);
  const user          = useAppStore((s) => s.user);
  const setGroupState = useAppStore((s) => s.setGroupState);
  const addMessage    = useAppStore((s) => s.addMessage);
  const addPin        = useAppStore((s) => s.addPin);
  const setOfflineQL  = useAppStore((s) => s.setOfflineQueueLength);
  const setIsFlushing = useAppStore((s) => s.setIsFlushing);

  // In-memory accumulator: userId → latest location + user info
  const memberDataRef = useRef<Map<string, RawMemberData>>(new Map());

  useEffect(() => {
    if (!activeRoom || !user) return;
    const roomId        = activeRoom.id;
    const groupSettings = activeRoom.settings;
    const groupContext  = activeRoom.context;

    memberDataRef.current.clear();

    // Seed initial member data from DB
    const seedMembers = async () => {
      console.log('[GroupRealtime] Seeding members for group:', roomId);

      // Fetch latest location per member (no time filter - get all available)
      const { data: locs, error: locsError } = await supabase
        .from('room_locations')
        .select('*')
        .eq('room_id', roomId)
        .order('updated_at', { ascending: false });

      if (locsError) {
        console.error('[GroupRealtime] Failed to fetch locations:', locsError);
        return;
      }

      const { data: members, error: membersError } = await supabase
        .from('room_members')
        .select('user_id, role, users(id, display_name, avatar_color)')
        .eq('room_id', roomId);

      if (membersError) {
        console.error('[GroupRealtime] Failed to fetch members:', membersError);
        return;
      }

      console.log('[GroupRealtime] Fetched locations:', locs?.length || 0, 'members:', members?.length || 0);

      if (!locs || !members) return;

      // Build a map of userId → role + user info
      const memberMeta = new Map<string, { role: MemberRole; user: { id: string; display_name: string; avatar_color: string } }>();
      for (const m of members) {
        const u = (m as unknown as { users: { id: string; display_name: string; avatar_color: string } }).users;
        memberMeta.set(m.user_id, { role: m.role as MemberRole, user: u });
      }

      // Latest location per user (locs already ordered desc, so first occurrence wins)
      const seen = new Set<string>();
      for (const loc of locs as DbRoomLocation[]) {
        if (seen.has(loc.user_id)) continue;
        seen.add(loc.user_id);
        const meta = memberMeta.get(loc.user_id);
        if (!meta) continue;
        memberDataRef.current.set(loc.user_id, {
          location: loc,
          user:     meta.user as unknown as import('../types').DbUser,
          role:     meta.role,
        });
      }

      console.log('[GroupRealtime] Seeded', memberDataRef.current.size, 'members from DB');
      rebuildGroupState();
    };

    seedMembers();

    // Flush any queued offline locations
    const tryFlush = async () => {
      const len = await getQueueLength();
      setOfflineQL(len);
      if (len > 0) {
        setIsFlushing(true);
        await flushQueue((flushed, total) => setOfflineQL(total - flushed));
        setIsFlushing(false);
        setOfflineQL(0);
      }
    };
    tryFlush();

    // Listen for online/offline to auto-flush
    const handleOnline = () => tryFlush();
    window.addEventListener('online', handleOnline);

    // Subscribe to per-group channel
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'room_locations',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const loc = payload.new as DbRoomLocation;
          const existing = memberDataRef.current.get(loc.user_id);
          if (existing) {
            memberDataRef.current.set(loc.user_id, { ...existing, location: loc });
          } else {
            // Fetch user info for first-seen member
            const { data } = await supabase
              .from('room_members')
              .select('role, users(id, display_name, avatar_color)')
              .eq('room_id', roomId)
              .eq('user_id', loc.user_id)
              .single();
            if (data) {
              const u = (data as unknown as { users: { id: string; display_name: string; avatar_color: string } }).users;
              memberDataRef.current.set(loc.user_id, {
                location: loc,
                user:     u as unknown as import('../types').DbUser,
                role:     data.role as MemberRole,
              });
            }
          }
          rebuildGroupState();
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'group_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          addMessage(payload.new as DbGroupMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'group_pins',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if ((payload.new as DbGroupPin).is_active) {
            addPin(payload.new as DbGroupPin);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'group_members',
          filter: `room_id=eq.${roomId}`,
        },
        (_payload) => {
          // Member joined/left — re-seed
          seedMembers();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[GroupRealtime] Subscribed to room ${roomId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[GroupRealtime] Channel error for room ${roomId}`);
        }
      });

    function rebuildGroupState() {
      const members = Array.from(memberDataRef.current.values());
      const state   = computeGroupState(members, groupSettings, groupContext);
      console.log('[GroupRealtime] Built group state:', {
        memberCount: members.length,
        centerLat: state.centerLat,
        centerLng: state.centerLng,
        separatedCount: state.separatedCount
      });
      setGroupState(state);
    }

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('online', handleOnline);
    };
  }, [activeRoom?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
