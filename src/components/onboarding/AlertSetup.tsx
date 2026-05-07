import { Icon } from '../ui/Icon';
import type { AlertPreference } from '../../types';
import { triggerHaptic } from '../../services/hapticFeedback';

interface Props {
  value: AlertPreference;
  onChange: (pref: AlertPreference) => void;
}

const OPTIONS: Array<{
  pref: AlertPreference;
  label: string;
  description: string;
  icon: 'vibrate' | 'volume' | 'silence';
  accent: string;
}> = [
  {
    pref:        'haptic',
    label:       'Haptic Buzz',
    icon:        'vibrate',
    accent:      'Stealth Alerts',
    description: 'Feel separation alerts through vibrations in your pocket.',
  },
  {
    pref:        'voice',
    label:       'Voice Prompts',
    icon:        'volume',
    accent:      'Audio Guided',
    description: 'Spoken updates directly to your connected headphones.',
  },
  {
    pref:        'silent',
    label:       'Visual Map',
    icon:        'silence',
    accent:      'Quiet Mode',
    description: 'No physical alerts. Keep an eye on the map display.',
  },
];

export function AlertSetup({ value, onChange }: Props) {
  const handleSelect = async (pref: AlertPreference) => {
    onChange(pref);
    if (pref === 'haptic') {
      await triggerHaptic('confirmed');
    }
  };

  return (
    <section className="setup-section">
      <div className="setup-section-head" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p className="setup-kicker">Step 2: Alerts</p>
        <h2 className="setup-section-title">How to reach you?</h2>
        <p className="setup-section-copy" style={{ margin: '0 auto' }}>
          Choose your primary method for receiving safety alerts.
        </p>
      </div>

      <div className="setup-choice-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.pref}
            className={`setup-choice-card ${value === opt.pref ? 'setup-choice-card--selected' : ''}`}
            onClick={() => handleSelect(opt.pref)}
            type="button"
            aria-pressed={value === opt.pref}
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

      {value === 'haptic' && (
        <div className="setup-inline-note fade-in" style={{ marginTop: '24px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Icon name="vibrate" size={16} />
          <span>Haptic preview enabled. Use the test buttons below to feel the patterns.</span>
        </div>
      )}

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
