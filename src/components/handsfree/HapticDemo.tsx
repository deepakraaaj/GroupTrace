import { triggerHaptic } from '../../services/hapticFeedback';
import type { HapticEvent } from '../../types';

const DEMOS: Array<{ event: HapticEvent; label: string; description: string }> = [
  { event: 'allGood',   label: 'All clear',   description: '3 light pulses. The group is together.' },
  { event: 'separated', label: 'Separated',   description: '1 heavy pulse. Someone drifted away.' },
  { event: 'newMessage',label: 'Message',     description: '2 medium pulses. A new note came in.' },
  { event: 'urgent',    label: 'Urgent',      description: '5 fast buzzes. Check the map now.' },
  { event: 'confirmed', label: 'Confirmed',   description: 'A double pulse. Your action landed.' },
];

export function HapticDemo() {
  return (
    <section className="setup-section haptic-demo">
      <div className="setup-section-head">
        <p className="setup-kicker">Preview</p>
        <h3 className="setup-section-title">Tap to feel the buzz</h3>
        <p className="setup-section-copy">Preview the vibration pattern before the ride starts.</p>
      </div>

      <div className="haptic-grid">
        {DEMOS.map(({ event, label, description }) => (
          <button
            key={event}
            className="haptic-card"
            onClick={() => triggerHaptic(event)}
            type="button"
          >
            <span className="haptic-card-label">{label}</span>
            <span className="haptic-card-desc">{description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
