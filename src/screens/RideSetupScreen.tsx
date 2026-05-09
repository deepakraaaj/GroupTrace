import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { CONTEXT_META } from '../types';
import { Icon } from '../components/ui/Icon';
import { AlertModePreview } from '../components/onboarding/AlertModePreview';
import { GeoSearch } from '../components/map/GeoSearch';

export function RideSetupScreen() {
  const navigate     = useNavigate();
  const activeRoom   = useAppStore((s) => s.activeRoom);
  const user         = useAppStore((s) => s.user);
  const setRideSetup = useAppStore((s) => s.setRideSetup);
  const setPrivacyMode = useAppStore((s) => s.setPrivacyMode);
  const setAlertPreference = useAppStore((s) => s.setAlertPreference);
  const [destination, setDestination] = useState<{ name: string; lat: number | null; lng: number | null }>({
    name: '',
    lat: null,
    lng: null
  });

  const meta = useMemo(
    () => CONTEXT_META[activeRoom?.context || 'biker'],
    [activeRoom?.context]
  );

  useEffect(() => {
    if (!activeRoom) {
      navigate('/', { replace: true });
    }
  }, [activeRoom, navigate]);

  const handleLaunch = () => {
    setRideSetup({
      privacyMode:     'full',
      alertPreference: 'haptic',
      destinationLat:  destination.lat,
      destinationLng:  destination.lng,
      destinationName: destination.name.trim() || null,
    });
    setPrivacyMode('full');
    setAlertPreference('haptic');
    navigate('/active-ride');
  };

  if (!activeRoom) return null;

  return (
    <div className="screen screen--scroll ride-setup-screen">
      <header className="screen-header">
        <button className="btn-ghost btn-sm" onClick={() => navigate('/')}>
          <Icon name="arrow-left" size={20} />
          <span>Back</span>
        </button>

        <div className="header-status" style={{ marginLeft: 'auto' }}>
          <span className="status-dot online" />
          Live Sync
        </div>
      </header>

      <div className="setup-container">
        <section className="setup-hero fade-in">
          <p className="setup-kicker">Ready to start</p>
          <h1 className="setup-title">{activeRoom.name}</h1>
          <p className="setup-copy">
            {meta.label} session for {user?.display_name}. Location is shared with everyone in the group.
          </p>
        </section>

        <div className="setup-content">
          <section className="setup-card fade-in">
            <AlertModePreview />

            <div className="input-group setup-destination">
              <label className="input-label" htmlFor="ride-destination">Destination (optional)</label>
              <GeoSearch
                onSelect={(name, lat, lng) => setDestination({ name, lat, lng })}
                placeholder="e.g. Mountain Pass Cafe"
              />
            </div>
          </section>

          <div className="setup-actions">
            <button className="btn-secondary" onClick={() => navigate('/')}>
              <Icon name="arrow-left" size={18} />
              Cancel
            </button>
            <button className="btn-primary btn-xl" onClick={handleLaunch} style={{ flex: 1 }}>
              Launch Live Session
              <Icon name="compass" size={20} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ride-setup-screen {
          background:
            radial-gradient(circle at 100% 0%, rgba(6, 214, 160, 0.05) 0%, transparent 40%),
            var(--color-bg);
        }
        .setup-container {
          width: min(800px, 100%);
          margin: 0 auto;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .setup-hero {
          text-align: center;
        }
        .setup-kicker {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--color-accent);
          margin-bottom: 12px;
        }
        .setup-title {
          font-size: 42px;
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 16px;
        }
        .setup-copy {
          max-width: 500px;
          margin: 0 auto;
          color: var(--color-text-sub);
          line-height: 1.6;
          font-size: 15px;
        }
        .setup-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .setup-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 0;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }
        .setup-destination {
          padding: 24px;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid var(--color-border);
        }



        .setup-actions {
          margin-top: 0;
          display: flex;
          gap: 16px;
          padding-top: 2px;
        }
        .setup-actions .btn-primary {
          flex: 1;
        }
        .header-status {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-sub);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-dot.online {
          background: var(--color-accent);
          box-shadow: 0 0 6px var(--color-accent);
        }
        @media (max-width: 640px) {
          .setup-container {
            padding: 24px 16px;
            gap: 20px;
          }
          .setup-content {
            gap: 20px;
          }
          .setup-title {
            font-size: 32px;
          }
          .setup-copy {
            font-size: 14px;
          }
          .setup-card {
            padding: 0;
          }


          .setup-actions {
            gap: 10px;
          }
          .setup-actions .btn-secondary {
            flex: 0 0 auto;
            min-width: 96px;
          }
          .setup-actions .btn-primary {
            min-height: 52px;
          }
        }
        @media (max-width: 420px) {
          .setup-container {
            padding: 12px 14px 16px;
          }
          .setup-content {
            gap: 16px;
          }
          .setup-title {
            font-size: 26px;
          }
          .setup-copy {
            font-size: 12px;
          }
          .setup-card {
            padding: 14px;
          }


          .setup-actions {
            gap: 8px;
          }
          .setup-actions .btn-secondary {
            min-width: 88px;
          }
        }
      `}</style>
    </div>
  );
}
