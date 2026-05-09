import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { supabase } from '../../services/supabaseClient';
import type { DbRoomLocation } from '../../types';

export function LocationDebug() {
  const myPosition = useAppStore((s) => s.myPosition);
  const user = useAppStore((s) => s.user);
  const activeRoom = useAppStore((s) => s.activeRoom);
  const groupState = useAppStore((s) => s.groupState);

  const [dbLocations, setDbLocations] = useState<DbRoomLocation[]>([]);
  const [lastChecked, setLastChecked] = useState<number>(Date.now());

  useEffect(() => {
    if (!activeRoom || !user) return;

    const checkDB = async () => {
      try {
        const { data, error } = await supabase
          .from('room_locations')
          .select('*')
          .eq('room_id', activeRoom.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setDbLocations(data || []);
        setLastChecked(Date.now());
      } catch (err) {
        console.error('[LocationDebug] Failed to fetch DB locations:', err);
      }
    };

    const interval = setInterval(checkDB, 2000);
    checkDB();
    return () => clearInterval(interval);
  }, [activeRoom?.id, user?.id]);

  if (!user || !activeRoom || !myPosition) {
    return (
      <div className="location-debug">
        <h3>⚠️ Debug: Waiting for data...</h3>
        <p>user: {user?.id}</p>
        <p>activeRoom: {activeRoom?.id}</p>
        <p>myPosition: {myPosition ? 'present' : 'null'}</p>
      </div>
    );
  }

  return (
    <div className="location-debug">
      <div className="debug-card">
        <h3>📍 MY POSITION (Browser Geolocation)</h3>
        <code>
          Lat: {myPosition.lat.toFixed(6)}<br />
          Lng: {myPosition.lng.toFixed(6)}<br />
          Accuracy: {myPosition.accuracy?.toFixed(1)}m<br />
          Timestamp: {new Date(myPosition.timestamp).toLocaleTimeString()}
        </code>
      </div>

      <div className="debug-card">
        <h3>🗄️ DATABASE RECORD (My Location)</h3>
        {dbLocations.find((l) => l.user_id === user.id) ? (
          <code>
            {(() => {
              const myLoc = dbLocations.find((l) => l.user_id === user.id)!;
              return (
                <>
                  Lat: {myLoc.latitude.toFixed(6)}<br />
                  Lng: {myLoc.longitude.toFixed(6)}<br />
                  Accuracy: {myLoc.accuracy?.toFixed(1)}m<br />
                  Updated: {new Date(myLoc.updated_at).toLocaleTimeString()}
                </>
              );
            })()}
          </code>
        ) : (
          <span style={{ color: '#ef4444' }}>❌ Not in database!</span>
        )}
      </div>

      <div className="debug-card">
        <h3>👥 GROUP STATE (All Members)</h3>
        {groupState?.members.length ? (
          groupState.members.map((member) => (
            <div key={member.userId} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <strong>{member.displayName}</strong> {member.userId === user.id && '(me)'}
              <br />
              <code style={{ fontSize: '11px' }}>
                Lat: {member.lat.toFixed(6)}<br />
                Lng: {member.lng.toFixed(6)}<br />
                Status: {member.status}
              </code>
            </div>
          ))
        ) : (
          <span style={{ color: '#ef4444' }}>❌ No members in group state</span>
        )}
      </div>

      <div className="debug-card">
        <h3>🔄 ALL DATABASE LOCATIONS</h3>
        <small>Last checked: {new Date(lastChecked).toLocaleTimeString()}</small>
        <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px' }}>
          {dbLocations.map((loc) => (
            <div key={loc.user_id} style={{ fontSize: '11px', marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <strong>{loc.user_id.slice(0, 8)}</strong><br />
              {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}<br />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(loc.updated_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .location-debug {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 350px;
          max-height: 80vh;
          overflow-y: auto;
          background: rgba(24, 24, 27, 0.95);
          border: 2px solid var(--color-accent);
          border-radius: 12px;
          padding: 16px;
          font-size: 12px;
          color: #fff;
          z-index: 500;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .location-debug h3 {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .location-debug code {
          display: block;
          background: rgba(0, 0, 0, 0.3);
          padding: 8px;
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .debug-card {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .debug-card:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
