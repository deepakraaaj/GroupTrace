import { useEffect, useState, useRef } from 'react';
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
  const [detailPanelHeight, setDetailPanelHeight] = useState(0); // 0=hidden, 1=expanded
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const detailStartYRef = useRef(0);
  const { stop, pause5Min } = useRideLocation();

  useGroupRealtime();

  // Swipe gesture handler for detail panel
  const handleDetailPanelTouchStart = (e: React.TouchEvent) => {
    detailStartYRef.current = e.touches[0].clientY;
  };

  const handleDetailPanelTouchMove = (e: React.TouchEvent) => {
    if (!detailPanelRef.current) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - detailStartYRef.current;

    if (delta > 50) {
      // Swiped down → hide panel
      setDetailPanelHeight(0);
    }
  };

  const handleDetailPanelTap = () => {
    setDetailPanelHeight(detailPanelHeight === 0 ? 1 : 0);
  };

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

      {/* TOP STATUS BAR (Minimal) */}
      <div className="status-bar-mobile" style={{ background: allTogether ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)', borderColor: statusColor }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div className="status-indicator" style={{ background: statusColor }} />
          <span className="status-label">{activeRoom.name}</span>
          <span className="status-count" style={{ color: statusColor }}>{statusText}</span>
        </div>
        <button
          className="btn-icon-sm"
          onClick={() => setShowDebug(!showDebug)}
          title="Debug"
          style={{ opacity: showDebug ? 1 : 0.5 }}
        >
          🐛
        </button>
      </div>

      {/* BOTTOM SHEET - RIDERS DETAIL (Swipe to expand) */}
      <div
        ref={detailPanelRef}
        className={`detail-sheet ${detailPanelHeight > 0 ? 'expanded' : ''}`}
        onTouchStart={handleDetailPanelTouchStart}
        onTouchMove={handleDetailPanelTouchMove}
        style={{
          height: detailPanelHeight > 0 ? '60vh' : '80px',
        }}
      >
        {/* Sheet Handle */}
        <button
          className="sheet-handle"
          onClick={handleDetailPanelTap}
          title={detailPanelHeight > 0 ? 'Swipe down to close' : 'Swipe up to expand'}
        >
          <div className="sheet-indicator" />
          <span className="sheet-label">{riderCount} Riders</span>
          <Icon name={detailPanelHeight > 0 ? 'chevron-down' : 'chevron-up'} size={16} />
        </button>

        {/* Sheet Content */}
        {detailPanelHeight > 0 && (
          <div className="sheet-content fade-in">
            <AwarenessPanel />
          </div>
        )}
      </div>

      {/* VERTICAL BUTTON STACK (Right side, thumb-reachable) */}
      <div className="controls-stack">
        <button
          className="btn-secondary btn-round-mobile"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <Icon name="settings" size={24} />
        </button>

        <button
          className="btn-alert btn-round-mobile"
          onClick={() => navigate('/post-ride')}
          title="End ride"
        >
          <Icon name="log-out" size={24} />
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
          position: relative;
        }

        /* TOP STATUS BAR (Mobile-optimized) */
        .status-bar-mobile {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          border-bottom: 2px solid;
          backdrop-filter: blur(12px);
          padding: max(12px, env(safe-area-inset-top, 12px)) 12px 12px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-label {
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-count {
          font-family: var(--font-mono);
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .btn-icon-sm {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(24, 24, 27, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .btn-icon-sm:active {
          background: rgba(24, 24, 27, 0.95);
        }

        /* BOTTOM SHEET (Swipeable) */
        .detail-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 99;
          background: rgba(24, 24, 27, 0.98);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          display: flex;
          flex-direction: column;
          transition: height 0.3s ease-out;
          padding-bottom: max(0px, env(safe-area-inset-bottom, 0px));
          touch-action: none;
          user-select: none;
        }

        .detail-sheet.expanded {
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
        }

        /* Sheet Handle/Header */
        .sheet-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          min-height: 56px;
          touch-action: manipulation;
        }

        .sheet-indicator {
          width: 40px;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .sheet-label {
          flex: 1;
          text-align: left;
        }

        /* Sheet Content */
        .sheet-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px 16px 16px;
        }

        /* VERTICAL BUTTON STACK (Right side, reachable) */
        .controls-stack {
          position: absolute;
          bottom: max(100px, calc(env(safe-area-inset-bottom, 0px) + 20px));
          right: 16px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-round-mobile {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(24, 24, 27, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          color: #fff;
          transition: all 0.2s;
          touch-action: manipulation;
        }

        .btn-round-mobile:active {
          background: rgba(24, 24, 27, 0.95);
          border-color: rgba(255, 255, 255, 0.2);
          transform: scale(0.95);
        }

        .btn-secondary {
          color: var(--color-accent);
          border-color: rgba(6, 214, 160, 0.3);
        }

        .btn-alert {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: var(--color-alert);
        }

        .btn-alert:active {
          background: rgba(239, 68, 68, 0.3);
        }

        /* SETTINGS MODAL */
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
          padding-top: 16px;
          padding-bottom: max(24px, env(safe-area-inset-bottom, 24px));
          max-height: 85vh;
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

        /* RESPONSIVE: Tablet & Desktop */
        @media (min-width: 768px) {
          .controls-stack {
            flex-direction: row;
            bottom: 20px;
            gap: 8px;
          }

          .detail-sheet {
            height: 45vh !important;
            bottom: 0;
            border-radius: 0;
          }

          .detail-sheet.expanded {
            height: 60vh !important;
          }
        }
      `}</style>
    </div>
  );
}
