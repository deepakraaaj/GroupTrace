# GroupTrace Sessions Implementation Guide

## What's New

You now have a **clean, device-based session flow** without complexity:

1. **One person creates a ride** → Gets a simple code (e.g., `R4729`)
2. **Others join with the code** → Everyone sees each other on the map with distances
3. **Real-time tracking** → Distances update as people move
4. **Ride history** → Sessions are saved for later reference

No PINs, no pre-registration complexity. Just join a code.

---

## Database Migration

Run this SQL in your Supabase console (SQL Editor):

```bash
-- Copy the entire content from:
-- supabase/migrations/002_sessions_flow.sql
```

**What it does:**
- Updates `groups` table to support source/destination
- Creates new RPC functions: `create_session()`, `join_session_by_code()`
- Generates codes as "1 letter + 4 digits" (e.g., A1234, Z9999)
- Disables RLS for MVP (we'll add it back later)

---

## New Screens

| Route | Purpose |
|-------|---------|
| `/onboarding` | Name entry (one-time, stored locally) |
| `/` | Home: Start Ride or Join Ride |
| `/start-session` | Create a new ride with name, from, to |
| `/join-session` | Enter session code to join |
| `/ride/:sessionId` | Live map with participants & distances |
| `/post-ride/:sessionId` | Ride summary |

---

## Local Storage

User data is stored locally:
- `grouptrace_device_id` — Unique device identifier (UUID)
- `grouptrace_user_name` — User's display name

Clear these if you want to re-onboard.

---

## Testing Checklist

### Step 1: Apply Database Migration
1. Go to your Supabase project
2. Click SQL Editor
3. Copy/paste the contents of `supabase/migrations/002_sessions_flow.sql`
4. Run it

### Step 2: Test Create Ride
1. Open app → click "Get Started"
2. Enter name (e.g., "Ram") → Continue
3. Click "Start a Ride"
4. Fill in:
   - Ride name: "Friday Evening Ride"
   - From: "Tech Park, Bangalore"
   - To: "Indiranagar Lake"
5. Click "Create & Start Ride"
6. **Copy the 5-character code** (e.g., `R4729`)

### Step 3: Test Join Ride (New Browser Tab or Device)
1. Open app in new tab (or incognito)
2. Click "Get Started"
3. Enter a different name (e.g., "Priya")
4. Click "Join a Ride"
5. Paste the code you copied (e.g., `R4729`)
6. Both of you should now see the same map with participants

### Step 4: Test Live Tracking
1. In both tabs, you should see:
   - Session name, source, destination
   - List of participants
   - Distance from you to each participant
   - "Live" indicator when location is being tracked
2. Allow location access when browser asks
3. See distances update in real-time

### Step 5: Test End Ride
1. Click "End Ride"
2. See ride summary (name, route, participants, time)
3. Click "Back to Home"
4. Both tabs can now create/join a new ride

---

## Key Files

**New Utilities:**
- `src/utils/deviceId.ts` — Device ID & name persistence
- `src/utils/distance.ts` — Haversine distance calculation

**New Screens:**
- `src/screens/OnboardingScreen.tsx` — Name entry
- `src/screens/HomeScreen.tsx` — Main hub
- `src/screens/StartSessionScreen.tsx` — Create ride
- `src/screens/JoinSessionScreen.tsx` — Enter code
- `src/screens/ActiveRideScreen.tsx` — Live ride (refactored)
- `src/screens/PostRideScreen.tsx` — Summary (refactored)

**Database:**
- `supabase/migrations/002_sessions_flow.sql` — New schema

---

## What's Not Implemented Yet

These can be added later:
- ✗ Ride history screen
- ✗ RLS policies (security)
- ✗ Offline queue (store location while offline)
- ✗ Map tile loading (currently shows blank map)
- ✗ Sound alerts for separation
- ✗ Group chat/quick replies

---

## Common Issues

**"Code must be 1 letter + 4 digits"**
- Make sure you copy the full code (5 characters total)
- Example: `A1234`, `Z9999`, `R4729`

**"Session not found"**
- The session creator must have successfully created it first
- The code must be exact (case-insensitive, but entered correctly)

**"Waiting for location" on participants**
- Browser location permission may be denied
- Check browser console for geolocation errors
- Grant location permission explicitly

**Two people see different participants**
- Wait a few seconds for Realtime to sync
- Refresh the page if needed

---

## Next Steps (After Testing)

1. ✅ Implement ride history screen
2. ✅ Add RLS policies for security
3. ✅ Implement map tiles (Google Maps, Mapbox, etc.)
4. ✅ Add offline location queueing
5. ✅ User auth (if needed for persistence)

---

**You're ready to test!** Run `npm run dev`, clear your browser cache, and follow the testing checklist above.
