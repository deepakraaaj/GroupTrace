import { useMemo } from 'react';
import { useGroupState } from '../../hooks/useGroupState';
import { useAppStore } from '../../stores/appStore';
import { RiderCard } from './RiderCard';
import { formatDistance } from '../../utils/math';
import { CONTEXT_META, type GroupContext } from '../../types';
import { Icon } from '../ui/Icon';

export function AwarenessPanel() {
  const {
    context,
    riderCount,
    separatedCount,
    avgSpeedKmh,
    allTogether,
  } = useGroupState();
  const activeGroup = useAppStore((s) => s.activeGroup);

  if (!context || !activeGroup) return null;

  const meta = CONTEXT_META[context];
  const hasMembers = riderCount > 0;
  
  const statusLabel = !hasMembers
    ? 'Awaiting first ping'
    : separatedCount > 0
      ? `${separatedCount} Separated`
      : allTogether
        ? 'Group Together'
        : 'Live Syncing';

  return (
    <div className={`awareness-panel-modern ${separatedCount > 0 ? 'has-alerts' : ''}`}>
      <div className="awareness-main">
        <div className="awareness-left">
          <div className="awareness-icon-box">
             <Icon name="users" size={20} />
          </div>
          <div className="awareness-info">
            <h2 className="awareness-title">{activeGroup.name}</h2>
            <div className="awareness-meta">
               <span className="meta-item">#{activeGroup.short_code}</span>
               <span className="meta-divider" />
               <span className="meta-item">{meta.label}</span>
            </div>
          </div>
        </div>

        <div className={`awareness-status-pill ${separatedCount > 0 ? 'status-alert' : 'status-good'}`}>
           <div className="status-indicator" />
           {statusLabel}
        </div>
      </div>

      <div className="awareness-stats">
        <div className="mini-stat">
          <span className="mini-stat-label">MEMBERS</span>
          <span className="mini-stat-value">{riderCount}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">AVG SPEED</span>
          <span className="mini-stat-value">{Math.round(avgSpeedKmh)}<small>km/h</small></span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">SITUATION</span>
          <span className={`mini-stat-value ${separatedCount > 0 ? 'text-alert' : 'text-good'}`}>
            {separatedCount > 0 ? 'Attention' : 'Optimal'}
          </span>
        </div>
      </div>

      <style>{`
        .awareness-panel-modern {
          background: rgba(24, 24, 27, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          padding: 16px;
          box-shadow: var(--shadow-xl);
          transition: var(--transition);
        }
        .awareness-panel-modern.has-alerts {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(24, 24, 27, 0.95);
        }
        .awareness-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .awareness-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .awareness-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--color-surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .awareness-title {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 2px;
        }
        .awareness-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-sub);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .meta-divider {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--color-muted);
        }
        .awareness-status-pill {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-good {
          background: rgba(6, 214, 160, 0.1);
          color: var(--color-accent);
        }
        .status-alert {
          background: rgba(239, 68, 68, 0.2);
          color: var(--color-alert);
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .awareness-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .mini-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .mini-stat-label {
          font-size: 9px;
          font-weight: 800;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        }
        .mini-stat-value {
          font-size: 14px;
          font-weight: 700;
          font-family: var(--font-mono);
        }
        .mini-stat-value small {
          font-size: 10px;
          margin-left: 2px;
          opacity: 0.6;
        }
        .text-alert { color: var(--color-alert); }
        .text-good { color: var(--color-accent); }
      `}</style>
    </div>
  );
}
