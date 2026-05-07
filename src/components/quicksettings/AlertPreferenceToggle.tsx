import { triggerHaptic } from '../../services/hapticFeedback';
import { useAppStore } from '../../stores/appStore';
import type { AlertPreference } from '../../types';
import { Icon } from '../ui/Icon';

const OPTIONS: Array<{
  mode: AlertPreference;
  label: string;
  icon: 'vibrate' | 'volume' | 'silence';
}> = [
  { mode: 'haptic', label: 'Haptic', icon: 'vibrate' },
  { mode: 'voice', label: 'Voice', icon: 'volume' },
  { mode: 'silent', label: 'Silent', icon: 'silence' },
];

export function AlertPreferenceToggle() {
  const alertPreference = useAppStore((s) => s.alertPreference);
  const setAlertPreference = useAppStore((s) => s.setAlertPreference);

  const handleChange = async (mode: AlertPreference) => {
    setAlertPreference(mode);
    await triggerHaptic('confirmed');
  };

  return (
    <section className="alert-toggle-panel">
      <div className="alert-toggle-head">
        <div>
          <p className="alert-toggle-kicker">Map Controls</p>
          <h3 className="alert-toggle-title">Alert mode</h3>
        </div>
      </div>

      <div className="alert-toggle-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            className={`alert-toggle-btn ${alertPreference === opt.mode ? 'alert-toggle-btn--active' : ''}`}
            onClick={() => handleChange(opt.mode)}
            type="button"
            aria-pressed={alertPreference === opt.mode}
          >
            <Icon name={opt.icon} size={18} />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <p className="alert-toggle-copy">
        Choose haptic buzz, voice prompts, or silent map-only mode from the map screen.
      </p>

      <style>{`
        .alert-toggle-panel {
          background: rgba(24, 24, 27, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          padding: 16px;
          box-shadow: var(--shadow-lg);
        }
        .alert-toggle-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .alert-toggle-kicker {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--color-accent);
          margin-bottom: 4px;
        }
        .alert-toggle-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .alert-toggle-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .alert-toggle-btn {
          min-height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: var(--color-text-sub);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
          transition: var(--transition-fast);
        }
        .alert-toggle-btn--active {
          background: rgba(6, 214, 160, 0.16);
          color: var(--color-accent);
          border-color: var(--color-accent);
          box-shadow: 0 0 0 1px rgba(6, 214, 160, 0.15);
        }
        .alert-toggle-copy {
          margin-top: 10px;
          font-size: 11px;
          line-height: 1.5;
          color: var(--color-text-sub);
        }
        @media (max-width: 420px) {
          .alert-toggle-grid {
            gap: 6px;
          }
          .alert-toggle-btn {
            flex-direction: column;
            min-height: 56px;
            gap: 4px;
            padding: 10px 6px;
          }
        }
      `}</style>
    </section>
  );
}
