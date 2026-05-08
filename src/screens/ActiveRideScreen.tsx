import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { supabase } from '../services/supabaseClient';
import { MapView } from '../components/map/MapView';
import { getOrCreateDeviceId, getUserName } from '../utils/deviceId';
import { calculateDistance, formatDistance } from '../utils/distance';

interface Participant {
  id: string;
  device_id: string;
  display_name: string;
  latitude: number | null;
  longitude: number | null;
  distance_from_user: number | null;
}

interface SessionDetails {
  id: string;
  name: string;
  source: string;
  destination: string;
  created_at: string;
}

export function ActiveRideScreen() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rideTime, setRideTime] = useState(0);

  const deviceId = getOrCreateDeviceId();
  const userName = getUserName();

  // Load session details
  useEffect(() => {
    if (!sessionId) {
      navigate('/', { replace: true });
      return;
    }

    const loadSession = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('groups')
          .select('id, name, source, destination, created_at')
          .eq('id', sessionId)
          .eq('is_active', true)
          .single();

        if (fetchError) throw fetchError;
        setSession(data);
      } catch (e) {
        console.error('Failed to load session:', e);
        setError('Session not found');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, navigate]);

  // Subscribe to real-time participant updates
  useEffect(() => {
    if (!sessionId) return;

    const loadParticipants = async () => {
      try {
        // Get all members with their latest location
        const { data: memberData, error: membersError } = await supabase
          .from('group_members')
          .select('id, device_id, display_name_for_session, user_id')
          .eq('group_id', sessionId)
          .eq('is_active', true);

        if (membersError) throw membersError;

        if (memberData) {
          // Get latest location for each user
          const { data: locationData, error: locError } = await supabase
            .from('group_locations')
            .select('user_id, latitude, longitude')
            .eq('group_id', sessionId)
            .order('timestamp', { ascending: false });

          if (locError) throw locError;

          const locationMap = new Map();
          locationData?.forEach((loc: any) => {
            if (!locationMap.has(loc.user_id)) {
              locationMap.set(loc.user_id, loc);
            }
          });

          const mapped = memberData.map((member: any) => {
            const latestLocation = locationMap.get(member.user_id);
            const distance = userLocation && latestLocation
              ? calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  latestLocation.latitude,
                  latestLocation.longitude
                )
              : null;

            return {
              id: member.id,
              device_id: member.device_id,
              display_name: member.display_name_for_session,
              latitude: latestLocation?.latitude || null,
              longitude: latestLocation?.longitude || null,
              distance_from_user: distance,
            };
          });

          setParticipants(mapped);
        }
      } catch (e) {
        console.error('Failed to load participants:', e);
      }
    };

    loadParticipants();

    // Subscribe to changes
    const subscription = supabase
      .channel(`session:${sessionId}:members`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${sessionId}` },
        () => loadParticipants()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, userLocation]);

  // Start tracking user location
  useEffect(() => {
    let watchId: number;

    const startTracking = async () => {
      try {
        if ('geolocation' in navigator) {
          watchId = navigator.geolocation.watchPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation({ lat: latitude, lng: longitude });

              // Sync location to database
              if (session) {
                // Get the user_id for this device from the session members
                const { data: memberData } = await supabase
                  .from('group_members')
                  .select('id, user_id')
                  .eq('group_id', session.id)
                  .eq('device_id', deviceId)
                  .single();

                if (memberData?.user_id) {
                  await supabase.rpc('sync_location', {
                    p_group_id: session.id,
                    p_user_id: memberData.user_id,
                    p_lat: latitude,
                    p_lng: longitude,
                    p_accuracy: position.coords.accuracy,
                    p_speed: position.coords.speed,
                    p_heading: position.coords.heading,
                  });
                }
              }
            },
            (err) => {
              console.error('Geolocation error:', err);
              setError('Location access denied');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }
      } catch (e) {
        console.error('Error starting location tracking:', e);
      }
    };

    startTracking();
    return () => navigator.geolocation.clearWatch(watchId);
  }, [session, deviceId]);

  // Track ride duration
  useEffect(() => {
    const interval = setInterval(() => {
      setRideTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="screen screen--center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="screen screen--center">
        <div style={{ textAlign: 'center' }}>
          <Icon name="alert-circle" size={48} style={{ color: 'var(--color-alert)', marginBottom: '16px' }} />
          <p>{error || 'Session not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '24px' }}>
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active-ride-screen">
      <MapView />

      {/* TOP HUD — Session Info */}
      <div className="hud-top">
        <div className="session-info">
          <h2>{session.name}</h2>
          <div className="route-info">
            <span className="route-leg">
              <Icon name="map" size={14} />
              {session.source}
            </span>
            <span className="route-arrow">→</span>
            <span className="route-leg">
              <Icon name="map" size={14} />
              {session.destination}
            </span>
          </div>
        </div>
      </div>

      {/* CENTER — Participants List */}
      <div className="participants-panel">
        <div className="participants-header">
          <h3>Participants ({participants.length})</h3>
        </div>

        <div className="participants-list">
          {participants.map((p) => (
            <div key={p.id} className="participant-card">
              <div className="participant-avatar" style={{
                background: `hsl(${Math.abs(p.device_id.charCodeAt(0)) % 360}, 70%, 50%)`,
              }}>
                {p.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="participant-info">
                <div className="participant-name">{p.display_name}</div>
                {p.distance_from_user !== null ? (
                  <div className="participant-distance">
                    {formatDistance(p.distance_from_user)} away
                  </div>
                ) : (
                  <div className="participant-distance">Waiting for location</div>
                )}
              </div>
              <div className="participant-status">
                {p.latitude ? (
                  <span className="status-online">
                    <span className="dot" />
                    Live
                  </span>
                ) : (
                  <span className="status-offline">Offline</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM HUD — Controls */}
      <div className="hud-bottom">
        <div className="ride-controls">
          <div className="ride-timer">
            {formatTime(rideTime)}
          </div>

          <button
            className="btn-alert btn-lg"
            onClick={() => navigate(`/post-ride/${session.id}`)}
          >
            <Icon name="log-out" size={20} />
            End Ride
          </button>
        </div>
      </div>

      <style>{`
        .active-ride-screen {
          background: #000;
        }

        .hud-top {
          position: absolute;
          top: env(safe-area-inset-top, 20px);
          left: 16px;
          right: 16px;
          z-index: 20;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .session-info h2 {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .route-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-sub);
        }

        .route-leg {
          display: flex;
          align-items: center;
          gap: 4px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .route-arrow {
          color: var(--color-accent);
          font-weight: 700;
        }

        .participants-panel {
          position: absolute;
          bottom: 100px;
          left: 16px;
          right: 16px;
          max-height: 300px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px;
          z-index: 20;
          overflow-y: auto;
        }

        .participants-header {
          padding: 0 0 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 12px;
        }

        .participants-header h3 {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .participants-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .participant-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          transition: background 0.2s;
        }

        .participant-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .participant-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          color: #fff;
          flex-shrink: 0;
        }

        .participant-info {
          flex: 1;
          min-width: 0;
        }

        .participant-name {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .participant-distance {
          font-size: 11px;
          color: var(--color-text-sub);
        }

        .participant-status {
          font-size: 11px;
        }

        .status-online {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-accent);
          font-weight: 600;
        }

        .status-online .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-accent);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-offline {
          color: var(--color-text-sub);
        }

        .hud-bottom {
          position: absolute;
          bottom: env(safe-area-inset-bottom, 20px);
          left: 16px;
          right: 16px;
          z-index: 20;
        }

        .ride-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: space-between;
        }

        .ride-timer {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 18px;
        }

        .btn-lg {
          padding: 12px 20px;
          font-size: 16px;
        }

        @media (max-height: 700px) {
          .participants-panel {
            max-height: 200px;
          }
        }
      `}</style>
    </div>
  );
}
