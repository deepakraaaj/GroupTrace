import { useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { secondsSince, formatDistance } from '../../utils/math';
import type { MemberLocation } from '../../types';

const STATUS_COLOR: Record<string, string> = {
  together:  'var(--color-good)',
  slow:      'var(--color-caution)',
  separated: 'var(--color-alert)',
  offline:   'var(--color-muted)',
};

function MemberRow({ member }: { member: MemberLocation }) {
  const secAgo = Math.round(secondsSince(member.timestamp));
  const label  =
    member.status === 'offline'
      ? `offline · ${Math.round(secAgo / 60)} min ago`
      : `${formatDistance(member.distanceFromCenter)} · ${secAgo}s ago`;

  return (
    <div className="member-row">
      <div
        className="member-avatar"
        style={{ background: member.avatarColor }}
      >
        {member.displayName[0].toUpperCase()}
      </div>
      <div className="member-info">
        <span className="member-name">{member.displayName}</span>
        <span className="member-meta">{label}</span>
      </div>
      <div
        className="member-status-dot"
        style={{ background: STATUS_COLOR[member.status] }}
      />
    </div>
  );
}

export function MemberRoster() {
  const groupState = useAppStore((s) => s.groupState);

  const sorted = useMemo(() => {
    if (!groupState) return [];
    return [...groupState.members].sort((a, b) => {
      const order = { separated: 0, slow: 1, together: 2, offline: 3 };
      return order[a.status] - order[b.status];
    });
  }, [groupState?.members]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!groupState || sorted.length === 0) {
    return <p className="empty-state">Waiting for members to join…</p>;
  }

  return (
    <div className="member-roster">
      <div className="roster-header">
        <span>{sorted.length} members</span>
        {groupState.separatedCount > 0 && (
          <span className="roster-alert">
            {groupState.separatedCount} separated
          </span>
        )}
      </div>
      {sorted.map((m) => (
        <MemberRow key={m.userId} member={m} />
      ))}
    </div>
  );
}
