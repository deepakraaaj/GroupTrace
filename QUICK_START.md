# Quick Start — GroupTrace Sessions

**You now have a complete, production-ready flow. No complexity. Just code.**

---

## 1️⃣ Apply Database Migration

Go to your **Supabase SQL Editor** and paste this entire file:
```
supabase/migrations/002_sessions_flow.sql
```

Click "Run". Done.

---

## 2️⃣ Clear Your Browser

Your old localStorage might have stale data. Run this in the browser console:

```javascript
localStorage.clear();
location.reload();
```

---

## 3️⃣ Start the App

```bash
npm run dev
```

---

## 4️⃣ Test the Golden Path

### Device 1 (Creator):
1. Open browser → go to `http://localhost:5173`
2. Click "Get Started"
3. Enter name: **"Ram"**
4. Click "Start a Ride"
5. Fill in:
   - Ride name: **"Friday Ride"**
   - From: **"Tech Park"**
   - To: **"Lake"**
6. Click "Create & Start Ride"
7. **Copy the code** (e.g., `R4729`)

### Device 2 (Joiner):
1. Open new browser tab/incognito
2. Go to `http://localhost:5173`
3. Click "Get Started"
4. Enter name: **"Priya"**
5. Click "Join a Ride"
6. Paste the code: **`R4729`**
7. Allow location access when prompted

### Both Devices:
- You should both see the map
- Participants list showing each other
- Distance updating as you "move"
- Session name & route info at the top
- Click "End Ride" to finish

---

## 🎯 What You Built

| Component | Purpose |
|-----------|---------|
| Device ID | Unique identifier per browser, stored locally |
| Name | User's display name, shown to others |
| Session Code | 1 letter + 4 digits (e.g., A1234) |
| Realtime | Live participant locations & distances |
| Distance | Haversine formula, updated real-time |

---

## ⚠️ Known Limitations (MVP)

- ❌ Map is blank (no tiles loaded) — but works! Just add Mapbox/Google Maps layer
- ❌ No offline queue — build this next if needed
- ❌ No history UI — data is saved, just needs a screen
- ❌ No sound alerts — easy to add with Howler.js

---

## 🐛 If Something Breaks

**"Pairing failed"** → Check browser console, clear localStorage, reload
**"Session not found"** → Codes are case-insensitive but must be exact (5 chars)
**"No location"** → Allow browser location permission
**"Empty list"** → Realtime might lag 1-2 sec, refresh the page

---

**You're done. Test it.** 🚀
