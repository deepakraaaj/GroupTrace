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

  return (
    <div className={`rider-card rider-card--${member.status}`}>
      <div className="rider-avatar" style={{ background: member.avatarColor }}>
        {member.displayName[0].toUpperCase()}
      </div>
      <div className="rider-details">
        <span className="rider-name">{member.displayName}</span>
        <span className="rider-sub">
          {STATUS_LABEL[member.status]} · {formatDistance(member.distanceFromCenter)}
          {speedLabel && ` · ${speedLabel}`}
        </span>
        <span className="rider-time">{secAgo}s ago</span>
      </div>
    </div>
  );
}
