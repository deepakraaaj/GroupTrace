# 🛰️ GroupTrace

**Real-time Geolocation & Smart Awareness for Groups**

GroupTrace is a professional-grade, mobile-responsive web application designed for high-performance group session management. Whether you're on a bike expedition, a mountain trek, or a vehicle convoy, GroupTrace ensures everyone stays connected, safe, and synchronized through smart telemetry and context-aware alerts.

---

## 🚀 Vision

To eliminate the anxiety of losing group members during expeditions by providing a "glanceable," hands-free awareness system that works seamlessly across mobile and desktop.

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand (with Persistence)
- **Geospatial Engine**: MapLibre GL JS (High-performance vector maps)
- **Real-time Backend**: Supabase (Realtime Channels + Edge Functions)
- **Mobile Bridge**: Capacitor.js (Native GPS & Haptic access)
- **Styling**: Modern CSS3 (Mobile-first, glassmorphism, responsive grid architecture)
- **Animation**: Framer Motion for premium page transitions

---

## ✨ Key Features

### 1. Smart Dashboard
- **Recent Connections**: Quickly rejoin your last 5 sessions with a single tap.
- **Identity Badge**: Persistent 4-digit PIN for instant pairing without complex logins.
- **Mobile-First Design**: Optimized for one-handed operation on the move.

### 2. Context-Aware Tracking
- **Smart Thresholds**: Auto-adjusts separation alerts based on your activity:
  - **Biker**: 500m separation / 60s sync
  - **Trekking**: 200m separation / 45s sync
  - **Convoy**: 2km separation / 30s sync
  - **Family**: 100m separation / 30s sync
- **Separation Alerts**: Instant visual and haptic feedback if a member drops behind.

### 3. Hands-Free Operation
- **Voice Commands**: "Where is Rahul?", "How many people?", "Stop tracking."
- **Tactile Haptics**: Distinct vibration patterns for different alert types (Separation, All Good, Urgent).
- **Quick Settings**: Large-target UI for "Stop," "Silence," and "Pause" operations during high-speed activity.

### 4. Advanced Geospatial HUD
- **Awareness Panel**: Context-specific metrics (Avg speed, battery status, separation distance).
- **Map Overlays**: Separation circles, dropped pins (Wait here, Danger, Petrol), and real-time rider markers.
- **Direct DOM Markers**: Optimized marker rendering to prevent React re-render lag on low-end devices.

---

## 📱 Mobile vs 🖥️ Desktop

GroupTrace features a **Dual-Mode UI Architecture**:

- **Desktop Mode**: A professional three-column dashboard maximizing screen real estate for group planning and history review.
- **Mobile Mode**: A compact, high-contrast interface optimized for sunlight visibility and touch-sensitivity.

---

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/deepakraaaj/GroupTrace.git
cd GroupTrace
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🔋 Performance & Privacy

- **Battery Optimization**: Adaptive GPS polling based on movement and battery levels.
- **Privacy First**: Ephemeral session data. Broadcast modes include "Full Sharing," "Organizer Only," and "Anonymous."
- **Low Latency**: Built on Supabase Realtime for sub-100ms position updates.

---

## 🗺️ Roadmap

- [ ] Offline Map Tile Caching
- [ ] Emergency SOS External Broadcast
- [ ] Group Journey Replay & Statistics
- [ ] Native Android/iOS background service for 100% uptime

---

Built with ❤️ by **Deepak Raj B**
*Modernized with premium UI/UX standards.*
