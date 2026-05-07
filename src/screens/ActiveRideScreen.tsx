import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { AwarenessPanel } from '../components/awareness/AwarenessPanel';
import { QuickSettingsPanel } from '../components/quicksettings/QuickSettingsPanel';
import { AlertPreferenceToggle } from '../components/quicksettings/AlertPreferenceToggle';
import { QuickReplyBar } from '../components/communication/QuickReplyBar';
import { Icon } from '../components/ui/Icon';
import { LiveGeoOverlay } from '../components/awareness/LiveGeoOverlay';
import { useGroupRealtime } from '../hooks/useGroupRealtime';
import { MapView } from '../components/map/MapView';
import { useLocation as useRideLocation } from '../hooks/useLocation';

export function ActiveRideScreen() {
  const navigate      = useNavigate();
  const activeGroup   = useAppStore((s) => s.activeGroup);
  const [showSettings, setShowSettings] = useState(false);
  const { stop, pause5Min } = useRideLocation();

  useGroupRealtime();

  useEffect(() => {
    if (!activeGroup) {
      navigate('/', { replace: true });
    }
  }, [activeGroup, navigate]);

  if (!activeGroup) {
    return null;
  }

  return (
    <div className="screen active-ride-screen">
      <MapView />

      {/* TOP HUD */}
      <div className="hud-top">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <AlertPreferenceToggle />
          <LiveGeoOverlay />
        </div>
        <AwarenessPanel />
      </div>

      {/* BOTTOM HUD */}
      <div className="hud-bottom">
        <QuickReplyBar />
        
        <div className="ride-controls">
          <button className="btn-secondary btn-round" onClick={() => setShowSettings(true)}>
            <Icon name="settings" size={24} />
          </button>
          
          <div className="ride-status-pill">
            <div className="status-dot online" />
            <span className="status-text">ACTIVE SESSION</span>
            <span className="status-timer">00:12:45</span>
          </div>

          <button className="btn-alert btn-round" onClick={() => navigate('/post-ride')}>
            <Icon name="log-out" size={24} />
          </button>
        </div>
      </div>

      {/* PANELS */}
      {showSettings && (
        <div className="panel-overlay fade-in" onClick={() => setShowSettings(false)}>
          <div className="panel-container slide-up" onClick={e => e.stopPropagation()}>
            <QuickSettingsPanel
              onClose={() => setShowSettings(false)}
              onPause={pause5Min}
              onStop={stop}
            />
          </div>
        </div>
      )}

      <style>{`
        .active-ride-screen {
          background: #000;
        }
        .map-placeholder {
          position: absolute;
          inset: 0;
          background: #0f172a;
          overflow: hidden;
        }
        .map-grid-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .hud-top {
          position: absolute;
          top: env(safe-area-inset-top, 20px);
          left: 16px;
          right: 16px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hud-bottom {
          position: absolute;
          bottom: env(safe-area-inset-bottom, 20px);
          left: 16px;
          right: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 100;
        }
        .ride-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .btn-round {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(24, 24, 27, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-alert {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: var(--color-alert);
        }
        .ride-status-pill {
          flex: 1;
          height: 56px;
          background: rgba(24, 24, 27, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 12px;
        }
        .status-text {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--color-text-sub);
        }
        .status-timer {
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-accent);
        }
        .user-marker {
          position: absolute;
          width: 24px;
          height: 24px;
          z-index: 10;
        }
        .marker-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--color-accent);
          border: 3px solid #fff;
          box-shadow: 0 0 20px var(--color-accent);
        }
        .ripple::after {
          content: "";
          position: absolute;
          top: -20px;
          left: -20px;
          right: -20px;
          bottom: -20px;
          border-radius: 50%;
          border: 2px solid var(--color-accent);
          opacity: 0;
          animation: ripple 2s infinite;
        }
        @keyframes ripple {
          0% { transform: scale(0.5); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .partner-marker {
          position: absolute;
          width: 20px;
          height: 20px;
        }
        .partner-marker .marker-inner {
          background: var(--color-accent-2);
          box-shadow: 0 0 20px var(--color-accent-2);
        }
        .partner-label {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          color: #fff;
        }
        .panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
        }
        .panel-container {
          width: 100%;
          background: var(--color-bg);
          border-top-left-radius: var(--radius-lg);
          border-top-right-radius: var(--radius-lg);
          border-top: 1px solid var(--color-border);
          padding: 24px;
          padding-bottom: env(safe-area-inset-bottom, 24px);
          max-height: 80vh;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
