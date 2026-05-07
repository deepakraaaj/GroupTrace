import { useEffect } from 'react';
import { useGroupState } from '../../hooks/useGroupState';
import { useHaptics } from '../../hooks/useHaptics';
import { speak } from '../../services/voiceControl';
import { useAppStore } from '../../stores/appStore';
import { formatDistance } from '../../utils/math';

export function AlertBanner() {
  const { separatedMembers, suppressVisual, allTogether } = useGroupState();
  const { fire }         = useHaptics();
  const alertPreference  = useAppStore((s) => s.alertPreference);
  const isAlertsMuted    = useAppStore((s) => s.isAlertsMuted);

  useEffect(() => {
    if (allTogether || isAlertsMuted || separatedMembers.length === 0) return;

    fire('separated');

    if (alertPreference === 'voice') {
      const names = separatedMembers.map((m) => m.displayName).join(', ');
      speak(`Alert: ${names} ${separatedMembers.length === 1 ? 'is' : 'are'} separated from the group.`);
    }
  }, [separatedMembers.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (allTogether || suppressVisual || separatedMembers.length === 0) return null;

  return (
    <div className="alert-banner" role="alert" aria-live="assertive">
      <span className="alert-icon">⚠️</span>
      <div className="alert-content">
        {separatedMembers.length === 1 ? (
          <span>
            <strong>{separatedMembers[0].displayName}</strong> is{' '}
            {formatDistance(separatedMembers[0].distanceFromCenter)} away
          </span>
        ) : (
          <span>
            <strong>{separatedMembers.length} members</strong> are separated
          </span>
        )}
      </div>
    </div>
  );
}
