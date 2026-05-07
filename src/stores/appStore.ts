import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppUser,
  ActiveGroup,
  GroupListItem,
  GroupState,
  RawPosition,
  ActiveTrip,
  PrivacyMode,
  AlertPreference,
  GroupPin,
  GroupMessage,
  RideSetup,
} from '../types';

interface AppState {
  // Auth
  user: AppUser | null;
  isAuthLoading: boolean;

  // Group
  activeGroup: ActiveGroup | null;
  groupList: GroupListItem[];

  // Group realtime state
  groupState: GroupState | null;

  // My tracking state
  myPosition: RawPosition | null;
  isTracking: boolean;
  isPaused: boolean;

  // Ride setup
  rideSetup: RideSetup;

  // Trip
  activeTrip: ActiveTrip | null;

  // Pins & messages
  pins: GroupPin[];
  messages: GroupMessage[];

  // Offline sync
  offlineQueueLength: number;
  isFlushing: boolean;

  // UI flags
  isAlertsMuted: boolean;
  alertPreference: AlertPreference;

  // Actions — auth
  setUser: (user: AppUser | null) => void;
  setAuthLoading: (v: boolean) => void;

  // Actions — groups
  setActiveGroup: (group: ActiveGroup | null) => void;
  setGroupList: (list: GroupListItem[]) => void;
  addGroupToList: (item: GroupListItem) => void;

  // Actions — realtime state
  setGroupState: (state: GroupState) => void;

  // Actions — tracking
  setMyPosition: (pos: RawPosition) => void;
  setIsTracking: (v: boolean) => void;
  setIsPaused: (v: boolean) => void;

  // Actions — ride setup
  setRideSetup: (setup: Partial<RideSetup>) => void;
  setPrivacyMode: (mode: PrivacyMode) => void;

  // Actions — trip
  setActiveTrip: (trip: ActiveTrip | null) => void;

  // Actions — pins & messages
  setPins: (pins: GroupPin[]) => void;
  addPin: (pin: GroupPin) => void;
  setMessages: (msgs: GroupMessage[]) => void;
  addMessage: (msg: GroupMessage) => void;

  // Actions — offline
  setOfflineQueueLength: (n: number) => void;
  setIsFlushing: (v: boolean) => void;

  // Actions — UI
  setAlertsMuted: (v: boolean) => void;
  setAlertPreference: (pref: AlertPreference) => void;

  // Reset on leave
  resetRideState: () => void;
}

const DEFAULT_RIDE_SETUP: RideSetup = {
  privacyMode:     'full',
  alertPreference: 'haptic',
  destinationLat:  null,
  destinationLng:  null,
  destinationName: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user:               null,
      isAuthLoading:      true,
      activeGroup:        null,
      groupList:          [],
      groupState:         null,
      myPosition:         null,
      isTracking:         false,
      isPaused:           false,
      rideSetup:          DEFAULT_RIDE_SETUP,
      activeTrip:         null,
      pins:               [],
      messages:           [],
      offlineQueueLength: 0,
      isFlushing:         false,
      isAlertsMuted:      false,
      alertPreference:    'haptic',

      setUser:           (user) => set({ user }),
      setAuthLoading:    (v)    => set({ isAuthLoading: v }),

      setActiveGroup:    (group) => set({ activeGroup: group }),
      setGroupList:      (list)  => set({ groupList: list }),
      addGroupToList:    (item)  =>
        set((s) => ({
          groupList: [item, ...s.groupList.filter((g) => g.id !== item.id)].slice(0, 10),
        })),

      setGroupState: (state) => set({ groupState: state }),

      setMyPosition: (pos) => set({ myPosition: pos }),
      setIsTracking: (v)   => set({ isTracking: v }),
      setIsPaused:   (v)   => set({ isPaused: v }),

      setRideSetup: (setup) =>
        set((s) => ({ rideSetup: { ...s.rideSetup, ...setup } })),
      setPrivacyMode: (mode) =>
        set((s) => ({ rideSetup: { ...s.rideSetup, privacyMode: mode } })),

      setActiveTrip: (trip) => set({ activeTrip: trip }),

      setPins:    (pins) => set({ pins }),
      addPin:     (pin)  => set((s) => ({ pins: [pin, ...s.pins] })),
      setMessages: (msgs) => set({ messages: msgs }),
      addMessage:  (msg)  =>
        set((s) => ({ messages: [msg, ...s.messages].slice(0, 200) })),

      setOfflineQueueLength: (n) => set({ offlineQueueLength: n }),
      setIsFlushing:         (v) => set({ isFlushing: v }),

      setAlertsMuted:      (v)    => set({ isAlertsMuted: v }),
      setAlertPreference:  (pref) => set({ alertPreference: pref }),

      resetRideState: () =>
        set({
          activeGroup:        null,
          groupState:         null,
          myPosition:         null,
          isTracking:         false,
          isPaused:           false,
          activeTrip:         null,
          pins:               [],
          messages:           [],
          offlineQueueLength: 0,
          isFlushing:         false,
          rideSetup:          DEFAULT_RIDE_SETUP,
        }),
    }),
    {
      name: 'grouptrace-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        groupList: state.groupList,
        alertPreference: state.alertPreference,
      }),
    }
  )
);
