// ─────────────────────────────────────────────
// Enums / Literal Unions
// ─────────────────────────────────────────────

export type GroupContext =
  | 'biker'
  | 'trekking'
  | 'convoy'
  | 'pilgrimage'
  | 'family'
  | 'delivery'
  | 'tour_guide';

export type MemberRole = 'member' | 'organizer' | 'guide' | 'parent' | 'dispatcher';

export type TripStatus = 'planned' | 'active' | 'completed';

export type PinType = 'wait_here' | 'danger' | 'petrol' | 'regroup' | 'checkpoint';

export type MessageType = 'text' | 'preset' | 'system' | 'alert';

export type PrivacyMode = 'full' | 'organizer_only' | 'anonymous';

export type AlertPreference = 'haptic' | 'voice' | 'silent';

export type MemberStatus = 'together' | 'slow' | 'separated' | 'offline';

export type DeliveryStatus = 'en_route' | 'at_location' | 'delayed' | 'done';

// ─────────────────────────────────────────────
// Database Row Types (mirror Postgres schema)
// ─────────────────────────────────────────────

export interface DbUser {
  id: string;
  display_name: string;
  phone_hash: string | null;
  avatar_color: string;
  device_id: string | null;
  created_at: string;
}

export interface DbRoom {
  id: string;
  code: string;
  name: string;
  context: GroupContext;
  organizer_id: string;
  is_active: boolean;
  created_at: string;
}

export interface DbRoomMember {
  room_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  last_seen_at: string;
}

export interface DbRoomLocation {
  room_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;   // m/s
  heading: number | null; // 0–360
  updated_at: string;
}

export interface DbTrip {
  id: string;
  group_id: string;
  name: string;
  destination_lat: number | null;
  destination_lng: number | null;
  destination_name: string | null;
  status: TripStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface DbGroupPin {
  id: string;
  group_id: string;
  created_by: string;
  pin_type: PinType;
  latitude: number;
  longitude: number;
  message: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbGroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  message_type: MessageType;
  created_at: string;
}

// ─────────────────────────────────────────────
// Context-specific Settings (stored in groups.settings JSONB)
// ─────────────────────────────────────────────

export interface GroupSettings {
  separationThresholdMeters: number;
  syncThresholdMeters: number;
  syncThresholdSeconds: number;
  // biker
  ridingSpeedKmh?: number;
  stoppedSpeedKmh?: number;
  // trekking
  walkingSpeedKmh?: number;
  restingSpeedKmh?: number;
  // convoy
  highwaySpeedKmh?: number;
  citySpeedKmh?: number;
  missedTurnHeadingDegrees?: number;
  // pilgrimage
  maxGroupSize?: number;
  // delivery
  stationaryAlertMinutes?: number;
}

// ─────────────────────────────────────────────
// App-level State Types
// ─────────────────────────────────────────────

export interface AppUser {
  id: string;
  display_name: string;
  avatar_color: string;
  phone_hash: string | null;
  device_id: string | null;
}

export interface ActiveRoom {
  id: string;
  code: string;
  name: string;
  context: GroupContext;
  organizer_id: string;
  settings: GroupSettings;
  myRole: MemberRole;
}

export interface RoomListItem {
  id: string;
  code: string;
  name: string;
  context: GroupContext;
  myRole: MemberRole;
  last_seen_at: string;
  is_active: boolean;
}

// ─────────────────────────────────────────────
// Live Member State (derived from realtime + locations)
// ─────────────────────────────────────────────

export interface MemberLocation {
  userId: string;
  displayName: string;
  avatarColor: string;
  role: MemberRole;
  lat: number;
  lng: number;
  speed: number | null;      // m/s
  heading: number | null;
  accuracy: number | null;
  timestamp: number;         // ms epoch
  status: MemberStatus;
  distanceFromCenter: number; // meters
  deliveryStatus?: DeliveryStatus;
}

// ─────────────────────────────────────────────
// Group State (computed client-side)
// ─────────────────────────────────────────────

export interface GroupState {
  centerLat: number | null;
  centerLng: number | null;
  riderCount: number;
  separatedCount: number;
  avgSpeedKmh: number;
  members: MemberLocation[];
  separatedMembers: MemberLocation[];
  computedAt: number; // ms epoch
}

// ─────────────────────────────────────────────
// GPS / Geo Sync
// ─────────────────────────────────────────────

export interface RawPosition {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface GeoSyncState {
  lastSyncPosition: RawPosition | null;
  lastSyncTime: number;
  currentPosition: RawPosition | null;
  isTracking: boolean;
  isPaused: boolean;
}

// ─────────────────────────────────────────────
// Offline Queue
// ─────────────────────────────────────────────

export interface QueuedLocationUpdate {
  id: string;
  groupId: string;
  userId: string;
  position: RawPosition;
  queuedAt: number;
}

// ─────────────────────────────────────────────
// Pins & Messages (enriched)
// ─────────────────────────────────────────────

export interface GroupPin extends DbGroupPin {
  creatorName?: string;
}

export interface GroupMessage extends DbGroupMessage {
  senderName?: string;
  senderColor?: string;
}

// ─────────────────────────────────────────────
// Trip
// ─────────────────────────────────────────────

export interface ActiveTrip {
  id: string;
  name: string;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationName: string | null;
  status: TripStatus;
  startedAt: string | null;
}

export interface TripStats {
  durationMinutes: number;
  totalDistanceKm: number;
  separationEvents: number;
  stopsCount: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
}

// ─────────────────────────────────────────────
// Haptics
// ─────────────────────────────────────────────

export type HapticEvent =
  | 'allGood'
  | 'separated'
  | 'newMessage'
  | 'urgent'
  | 'confirmed';

export interface HapticPulse {
  duration: number;
  intensity: 'light' | 'medium' | 'heavy';
  pause: number; // ms gap before next pulse
}

// ─────────────────────────────────────────────
// Voice
// ─────────────────────────────────────────────

export interface VoiceCommand {
  pattern: RegExp;
  handler: (match: RegExpMatchArray) => string | Promise<string>;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

// ─────────────────────────────────────────────
// Preset Messages
// ─────────────────────────────────────────────

export const PRESET_MESSAGES = [
  "I'm okay, just slow",
  'Wait for me at next stop',
  'Taking a break',
  'Need help',
  'On my way',
  'Already at destination',
  'Missed the turn, coming back',
  'Low battery',
] as const;

export type PresetMessage = typeof PRESET_MESSAGES[number];

// ─────────────────────────────────────────────
// Ride Setup
// ─────────────────────────────────────────────

export interface RideSetup {
  privacyMode: PrivacyMode;
  alertPreference: AlertPreference;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationName: string | null;
}

// ─────────────────────────────────────────────
// Supabase Realtime payload shapes
// ─────────────────────────────────────────────

export interface RealtimeLocationPayload {
  new: DbRoomLocation;
  old: Partial<DbRoomLocation>;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface RealtimeMessagePayload {
  new: DbGroupMessage;
  eventType: 'INSERT';
}

export interface RealtimePinPayload {
  new: DbGroupPin;
  eventType: 'INSERT' | 'UPDATE';
}

export interface RealtimeMemberPayload {
  new: DbRoomMember;
  eventType: 'INSERT' | 'UPDATE';
}

// ─────────────────────────────────────────────
// Context UI Metadata
// ─────────────────────────────────────────────

export interface ContextMeta {
  label: string;
  icon: string;
  description: string;
  checklist: string[];
}

export const CONTEXT_META: Record<GroupContext, ContextMeta> = {
  biker: {
    label: 'Biker Group',
    icon: 'compass',
    description: 'Highway & city rides, convoy tracking',
    checklist: [
      'Check tyre pressure',
      'Full tank of fuel',
      'Helmets strapped',
      'Mirrors adjusted',
    ],
  },
  trekking: {
    label: 'Trekking / Hiking',
    icon: 'map',
    description: 'Trail groups, guide-led hikes',
    checklist: [
      'Water bottles filled',
      'First aid kit present',
      'Trail map downloaded',
      'Proper footwear worn',
    ],
  },
  convoy: {
    label: 'Road Trip Convoy',
    icon: 'users',
    description: 'Multi-car road trips, turn alerts',
    checklist: [
      'Walkie-talkies tested',
      'Destination set in GPS',
      'Child seats secured',
      'Snacks and drinks ready',
    ],
  },
  pilgrimage: {
    label: 'Pilgrimage Group',
    icon: 'shield',
    description: 'Large slow-moving groups, up to 100',
    checklist: [
      'Headcount complete',
      'Group banner visible',
      'Support vehicle ready',
      'Scheduled stops confirmed',
    ],
  },
  family: {
    label: 'Family Outing',
    icon: 'eye',
    description: 'Child safety, theme parks, malls',
    checklist: [
      'Phones fully charged',
      'Meeting point agreed',
      'Safe zones defined',
      'Power banks carried',
    ],
  },
  delivery: {
    label: 'Delivery Fleet',
    icon: 'settings',
    description: 'Micro-fleet tracking, ETA monitoring',
    checklist: [
      'Load secured',
      'Route optimized',
      'Customer notified',
      'Fuel level checked',
    ],
  },
  tour_guide: {
    label: 'Tour Guide',
    icon: 'users',
    description: 'Tourist groups, headcount, gather here',
    checklist: [
      'Radio headsets on',
      'Tickets in hand',
      'Weather check done',
      'Gathering time set',
    ],
  },
};
