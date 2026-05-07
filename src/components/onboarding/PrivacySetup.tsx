import { Icon } from '../ui/Icon';
import type { PrivacyMode } from '../../types';

interface Props {
  value: PrivacyMode;
  onChange: (mode: PrivacyMode) => void;
}

const OPTIONS: Array<{
  mode: PrivacyMode;
  label: string;
  description: string;
  accent: string;
  icon: 'eye' | 'shield' | 'silence';
}> = [
  {
    mode:        'full',
    label:       'Shared with everyone',
    accent:      'Open Ride',
    icon:        'eye',
    description: 'Everyone in the group can see your live position.',
  },
  {
    mode:        'organizer_only',
    label:       'Shared with organizer',
    accent:      'Leader View',
    icon:        'shield',
    description: 'Only the organizer can see your precise location.',
  },
  {
    mode:        'anonymous',
    label:       'Hidden from group',
    accent:      'Private Mode',
    icon:        'silence',
    description: 'Follow the ride without broadcasting your location.',
  },
];

export function PrivacySetup({ value, onChange }: Props) {
  return (
    <section className="setup-section">
      <div className="setup-section-head" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p className="setup-kicker">Step 1: Visibility</p>
        <h2 className="setup-section-title">Who can see your live position?</h2>
        <p className="setup-section-copy" style={{ margin: '0 auto' }}>
          Select how much of your location the group should see.
        </p>
      </div>

      <div className="setup-choice-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            className={`setup-choice-card ${value === opt.mode ? 'setup-choice-card--selected' : ''}`}
            onClick={() => onChange(opt.mode)}
            type="button"
            aria-pressed={value === opt.mode}
          >
            <div className="setup-choice-head">
              <div className="setup-choice-icon-wrap">
                <Icon name={opt.icon} size={24} />
              </div>
              <span className="setup-choice-accent">{opt.accent}</span>
            </div>
            <div className="setup-choice-body">
              <h3 className="setup-choice-title">{opt.label}</h3>
              <p className="setup-choice-desc">{opt.description}</p>
            </div>
            <div className="setup-choice-check-wrap">
              <div className="setup-choice-check">
                <Icon name="check" size={12} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .setup-choice-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--color-surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-sub);
          transition: var(--transition-fast);
        }
        .setup-choice-card--selected .setup-choice-icon-wrap {
          background: var(--color-accent);
          color: #000;
        }
        .setup-choice-accent {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-sub);
        }
        .setup-choice-card--selected .setup-choice-accent {
          color: var(--color-accent);
        }
        .setup-choice-check-wrap {
          position: absolute;
          top: 16px;
          right: 16px;
        }
        .setup-choice-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-surface-3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: var(--transition-fast);
        }
        .setup-choice-card--selected .setup-choice-check {
          background: var(--color-accent);
          color: #000;
        }
      `}</style>
    </section>
  );
}
