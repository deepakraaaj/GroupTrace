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
import { LocationDebug } from '../components/debug/LocationDebug';
import { useGroupState } from '../hooks/useGroupState';

export function ActiveRideScreen() {
  const navigate       = useNavigate();
  const activeRoom     = useAppStore((s) => s.activeRoom);
  const { riderCount, separatedCount, allTogether, members } = useGroupState();
  const [showSettings, setShowSettings] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const { stop, pause5Min } = useRideLocation();

  useGroupRealtime();

  useEffect(() => {
    if (!activeRoom) {
      navigate('/', { replace: true });
    }
  }, [activeRoom, navigate]);

  useEffect(() => {
    console.log('[ActiveRideScreen] Mounted, activeRoom:', activeRoom?.id);
  }, [activeRoom]);

  if (!activeRoom) {
    return null;
  }

  const statusText = allTogether ? `${riderCount} Together` : `${separatedCount}/${riderCount} Separated`;
  const statusColor = allTogether ? '#10b981' : '#ef4444';

  return (
    <div className="screen active-ride-screen">
      <MapView />

      {/* COMPACT STATUS BAR (Top) */}
      <div className="status-bar" style={{ background: allTogether ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)', borderColor: statusColor }}>
        <button
          className="status-bar-content"
          onClick={() => setShowDetailPanel(!showDetailPanel)}
          style={{ color: statusColor }}
        >
          <div className="status-indicator" style={{ background: statusColor }} />
          <span className="status-label">{activeRoom.name}</span>
          <span className="status-count">{statusText}</span>
          <Icon name={showDetailPanel ? 'chevron-up' : 'chevron-down'} size={16} />
        </button>
      </div>

      {/* DETAIL PANEL (Expandable) */}
      {showDetailPanel && (
        <div className="detail-panel fade-in">
          <AwarenessPanel />
        </div>
      )}

      {/* MINIMAL RIDER PILL (Bottom-Left) */}
      <div className="rider-pill">
        <button
          className="pill-button"
          onClick={() => setShowDetailPanel(!showDetailPanel)}
          title="Tap to see full list"
        >
          <span className="pill-count">{riderCount}</span>
          <span className="pill-label">Riders</span>
        </button>
      </div>

      {/* CONTROLS (Bottom-Right) */}
      <div className="controls-bar">
        <button
          className="btn-icon"
          onClick={() => setShowDebug(!showDebug)}
          title="Toggle location debug"
          style={{ opacity: 0.6, fontSize: '12px' }}
        >
          🐛
        </button>

        <button
          className="btn-secondary btn-round"
          onClick={() => setShowSettings(true)}
          title="Settings & pause ride"
        >
          <Icon name="settings" size={20} />
        </button>

        <button
          className="btn-alert btn-round"
          onClick={() => navigate('/post-ride')}
          title="End ride"
        >
          <Icon name="log-out" size={20} />
        </button>
      </div>

      {/* DEBUG PANEL (Toggle) */}
      {showDebug && <LocationDebug />}

      {/* SETTINGS MODAL */}
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
          overflow: hidden;
        }

        /* STATUS BAR (Top) */
        .status-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          border-bottom: 2px solid;
          backdrop-filter: blur(12px);
          padding: env(safe-area-inset-top, 12px) 0 0 0;
        }

        .status-bar-content {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s;
        }

        .status-bar-content:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-label {
          flex: 1;
          text-align: left;
        }

        .status-count {
          font-family: var(--font-mono);
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* DETAIL PANEL (Expandable) */
        .detail-panel {
          position: absolute;
          top: 52px;
          left: 0;
          right: 0;
          z-index: 99;
          background: rgba(24, 24, 27, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          max-height: 45vh;
          overflow-y: auto;
          padding: 16px;
        }

        /* RIDER PILL (Bottom-Left) */
        .rider-pill {
          position: absolute;
          bottom: 20px;
          left: 16px;
          z-index: 100;
        }

        .pill-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 60px;
          padding: 12px;
          background: rgba(24, 24, 27, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(6, 214, 160, 0.3);
          border-radius: 12px;
          color: var(--color-accent);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pill-button:hover {
          background: rgba(24, 24, 27, 0.95);
          border-color: var(--color-accent);
        }

        .pill-count {
          font-size: 20px;
          font-weight: 800;
        }

        .pill-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }

        /* CONTROLS BAR (Bottom-Right) */
        .controls-bar {
          position: absolute;
          bottom: 20px;
          right: 16px;
          z-index: 100;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(24, 24, 27, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: inherit;
        }

        .btn-icon:hover {
          background: rgba(24, 24, 27, 0.95);
          border-color: rgba(255, 255, 255, 0.2);
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
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          color: #fff;
          transition: all 0.2s;
        }

        .btn-round:hover {
          background: rgba(24, 24, 27, 0.95);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-secondary {
          color: var(--color-accent);
        }

        .btn-alert {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: var(--color-alert);
        }

        .btn-alert:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
        }

        /* MODAL */
        .panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
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

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
