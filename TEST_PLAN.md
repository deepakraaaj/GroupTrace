# GroupTrace 2-Device Location Sync Test Plan

## What Was Fixed

### 1. **Critical Issues**
- ✅ **Group data not fetching on join** — GroupSelectionScreen now fetches full group data (organizer_id, settings) from DB
- ✅ **Group settings not being applied** — AuthForm now uses `create_group` RPC which applies context-based default settings
- ✅ **RPC column name mismatch** — Fixed column names from `r_group_id` to `group_id` in pairing flow
- ✅ **Realtime subscription not logging** — Added subscribe status tracking to identify channel issues
- ✅ **Silent location broadcast failures** — Added error logging to broadcastLocation and geoSync

### 2. **Comprehensive Logging Added**
All these components now log to console for debugging:
- `[GeoSync]` — Location tracking start/stop, position updates, sync threshold checks
- `[LocationBroadcast]` — sync_location RPC calls and errors
- `[GroupRealtime]` — Member seeding, location fetches, group state building
- `[MapView]` — Map centering and GPS position detection
- `[MarkerLayer]` — Member rendering and count tracking

---

## How to Test (2-Device Local Pairing)

### Device 1 (Organizer)
1. Open the app in a browser/simulator
2. Sign in with:
   - Name: "Alice" (or any name)
   - PIN: "1234" (exactly 4 digits)
3. You'll get a PIN code shown (e.g., "1234")
4. Tap "Launch Live Session" → goes to the map
5. **Open browser DevTools (F12)** and watch the Console for:
   - `[GeoSync] Requesting location permissions...`
   - `[GeoSync] Location permissions granted`
   - `[GeoSync] Starting watch position...`
   - `[GeoSync] Watch position started with ID: ...`
   - `[GeoSync] Position update:` (repeated as you move)

### Device 2 (Member)
1. Open the app in a **different browser tab/window or actual device**
2. Sign in with:
   - Name: "Bob" (or any name)
   - PIN: "5678" (different from Device 1)
3. You'll see a "Pair with PIN" button
4. Enter Device 1's PIN: "1234"
5. **Open DevTools and watch the Console** for:
   - `[Pairing] Joined group: <uuid>`
   - `[GroupRealtime] Subscribed to group <uuid>`
   - `[GroupRealtime] Fetched locations: X members: X`
   - `[GeoSync]` messages as location starts tracking

### Both Devices
**Expected behavior:**
- Both devices start tracking their location (GPS on real devices, mock coordinates on web)
- Device 1's map should show:
  - Its own blue marker at center
  - Bob's marker appearing as he moves
  - A line connecting them
- Device 2's map should show:
  - Its own blue marker at center
  - Alice's marker appearing
  - Same connection line
- Move around → markers update in real-time on both maps

---

## Debugging Checklist

If it's NOT working, check the console for these clues:

| Console Message | Problem | Solution |
|---|---|---|
| `[GeoSync] Requesting location permissions... ` (no "granted" after) | Permissions denied | Check browser location permissions |
| No `[GeoSync]` messages at all | GPS not starting | Reload page, check Capacitor Geolocation plugin |
| `[LocationBroadcast] Failed to sync location: ...` | RPC call failing | Check Supabase connection, verify `sync_location` RPC exists |
| `[GroupRealtime] Subscribed to group` but `CHANNEL_ERROR` | Realtime subscription failed | Check Supabase realtime is enabled for `group_locations` table |
| `[GroupRealtime] Fetched locations: 0 members:` | No initial data | Verify locations are in DB (wait for first position update) |
| `[MapView] No position yet` (stays true) | myPosition never set | Check that onPositionUpdate is being called in geoSync |
| `[MarkerLayer] No group state` | groupState is null | Check setGroupState in useGroupRealtime is being called |

---

## Console Output Example (Successful Sync)

```
[GeoSync] Requesting location permissions...
[GeoSync] Location permissions granted
[GeoSync] Starting watch position...
[GeoSync] Watch position started with ID: 1
[GeoSync] Position update: {lat: 12.9716, lng: 77.5946, accuracy: 10}
[MapView] Centering map on my position: {lat: 12.9716, lng: 77.5946}
[LocationBroadcast] Location synced: {lat: 12.9716, lng: 77.5946}
[GroupRealtime] Subscribed to group abc-123
[GroupRealtime] Seeding members for group: abc-123
[GroupRealtime] Fetched locations: 1 members: 2
[GroupRealtime] Seeded 1 members from DB
[GroupRealtime] Built group state: {memberCount: 1, centerLat: 12.9716, centerLng: 77.5946, separatedCount: 0}
[MarkerLayer] Rendering members: {count: 1, myId: "user-1", organizerId: "user-2", memberIds: ["user-2"]}
```

---

## How to Test on Real Devices

1. Deploy to Supabase (if not already)
2. Build Capacitor iOS/Android app
3. Install on two physical devices
4. Open the same Supabase project on both
5. Sign in with different PINs
6. Pair them using PIN codes
7. Watch the real-time location sync

---

## Key Fixes Summary

```javascript
// BEFORE: organizer_id was empty string, settings were hardcoded
const group = data[0];
activeGroup = {
  organizer_id: '',  // ❌ Empty!
  settings: { separationThresholdMeters: 100, ... }  // ❌ Hardcoded!
}

// AFTER: Full group data fetched from DB with real settings
const groupData = await supabase.from('groups').select(...).eq('id', groupId).single();
activeGroup = {
  organizer_id: groupData.organizer_id,  // ✅ Real value
  settings: groupData.settings,  // ✅ Context-based defaults from DB
}
```

---

## Next Steps If Still Having Issues

1. **Check Supabase connection** — Verify VITE_SUPABASE_URL and VITE_SUPABASE_KEY are correct
2. **Verify database setup** — Run `test_setup.sql` to ensure all RPCs and tables exist
3. **Check Realtime is enabled** — In Supabase dashboard, verify `group_locations` table is in publications
4. **Monitor network tab** — Watch XHR requests to `sync_location` RPC
5. **Test on real device** — GPS works better on physical devices than web simulators
