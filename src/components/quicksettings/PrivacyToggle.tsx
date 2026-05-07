import { useAppStore } from '../../stores/appStore';
import { updatePrivacy } from '../../services/geoSync';
import type { PrivacyMode } from '../../types';

const MODES: Array<{ mode: PrivacyMode; label: string }> = [
  { mode: 'full',           label: 'Everyone' },
  { mode: 'organizer_only', label: 'Organizer' },
  { mode: 'anonymous',      label: 'Hidden' },
];

export function PrivacyToggle() {
  const privacyMode   = useAppStore((s) => s.rideSetup.privacyMode);
  const setPrivacy    = useAppStore((s) => s.setPrivacyMode);

  const handleChange = (mode: PrivacyMode) => {
    setPrivacy(mode);
    updatePrivacy(mode);
  };

  return (
    <div className="privacy-toggle">
      <span className="privacy-label">Privacy</span>
      <div className="privacy-options">
        {MODES.map(({ mode, label }) => (
          <button
            key={mode}
            className={`privacy-btn ${privacyMode === mode ? 'privacy-btn--active' : ''}`}
            onClick={() => handleChange(mode)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
