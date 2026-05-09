import { useMemo } from 'react';
import { secondsSince, formatDistance, msToKmh } from '../../utils/math';
import type { MemberLocation } from '../../types';

interface Props {
  member: MemberLocation;
  showSpeed?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  together:  'With group',
  slow:      'Falling behind',
  separated: 'Separated',
  offline:   'Offline',
};

export function RiderCard({ member, showSpeed = true }: Props) {
  const secAgo = Math.round(secondsSince(member.timestamp));

  const speedLabel = useMemo(() => {
    if (!showSpeed || member.speed == null) return null;
    return `${Math.round(msToKmh(member.speed))} km/h`;
  }, [member.speed, showSpeed]);

  const latFixed = member.lat.toFixed(4);
  const lngFixed = member.lng.toFixed(4);

  return (
    <>
      <div className={`rider-card rider-card--${member.status}`}>
        <div className="rider-avatar" style={{ background: member.avatarColor }}>
          {member.displayName[0].toUpperCase()}
        </div>
        <div className="rider-details">
          <div className="rider-header">
            <span className="rider-name">{member.displayName}</span>
            <span className={`rider-status-badge status-${member.status}`}>
              {STATUS_LABEL[member.status]}
            </span>
          </div>
          <div className="rider-coords">
            <code className="coord-value">{latFixed}</code>
            <span className="coord-sep">,</span>
            <code className="coord-value">{lngFixed}</code>
          </div>
          <span className="rider-sub">
            {formatDistance(member.distanceFromCenter)}
            {speedLabel && ` · ${speedLabel}`}
            {secAgo > 0 && ` · ${secAgo}s ago`}
          </span>
        </div>
      </div>

      <style>{`
        .rider-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .rider-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .rider-card--together {
          border-color: rgba(6, 214, 160, 0.2);
          background: rgba(6, 214, 160, 0.05);
        }

        .rider-card--together:hover {
          background: rgba(6, 214, 160, 0.1);
          border-color: rgba(6, 214, 160, 0.3);
        }

        .rider-card--separated {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.08);
        }

        .rider-card--separated:hover {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.4);
        }

        .rider-card--offline {
          border-color: rgba(107, 114, 128, 0.3);
          background: rgba(107, 114, 128, 0.05);
          opacity: 0.7;
        }

        .rider-avatar {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .rider-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rider-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .rider-name {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }

        .rider-status-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .status-together {
          background: rgba(6, 214, 160, 0.2);
          color: #06d6a0;
        }

        .status-slow {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .status-separated {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .status-offline {
          background: rgba(107, 114, 128, 0.2);
          color: #9ca3af;
        }

        .rider-coords {
          display: flex;
          align-items: center;
          gap: 2px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-accent);
        }

        .coord-value {
          background: rgba(6, 214, 160, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(6, 214, 160, 0.2);
        }

        .coord-sep {
          color: rgba(255, 255, 255, 0.4);
          margin: 0 2px;
        }

        .rider-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--font-mono);
        }
      `}</style>
    </>
  );
}
