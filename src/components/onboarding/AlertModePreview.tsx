import { useState } from 'react';
import { Icon } from '../ui/Icon';

const MODES = [
  {
    key: 'haptic',
    label: 'Haptic buzz',
    icon: 'vibrate' as const,
    title: 'Pocket pulse',
    description: 'The phone vibrates with short alert pulses. Best when you want silent awareness.',
  },
  {
    key: 'voice',
    label: 'Voice prompt',
    icon: 'volume' as const,
    title: 'Spoken alert',
    description: 'The phone reads the alert out loud. Good when you are looking away from the screen.',
  },
  {
    key: 'silent',
    label: 'Silent map',
    icon: 'silence' as const,
    title: 'Map only',
    description: 'No sound or vibration. You still see the map update visually.',
  },
] as const;

type ModeKey = (typeof MODES)[number]['key'];

function ModeVisual({ mode, compact = false }: { mode: ModeKey; compact?: boolean }) {
  const previewClassName = [
    'phone-preview',
    `phone-preview--${mode}`,
    compact ? 'phone-preview--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const bodyClassName = ['phone-body', compact ? 'phone-body--compact' : '']
    .filter(Boolean)
    .join(' ');

  const iconName = mode === 'haptic' ? 'vibrate' : mode === 'voice' ? 'volume' : 'silence';

  return (
    <div className={previewClassName} aria-hidden="true">
      {mode === 'haptic' && (
        <>
          <span className="pulse pulse-1" />
          <span className="pulse pulse-2" />
          <span className="pulse pulse-3" />
        </>
      )}

      {mode === 'voice' && (
        <div className="voice-waves">
          <span />
          <span />
          <span />
        </div>
      )}

      {mode === 'silent' && (
        <div className="silent-map">
          <span className="silent-dot" />
          <span className="silent-line silent-line--1" />
          <span className="silent-line silent-line--2" />
          <span className="silent-line silent-line--3" />
        </div>
      )}

      <div className={bodyClassName}>
        <Icon name={iconName} size={compact ? 20 : 24} />
      </div>
    </div>
  );
}

export function AlertModePreview() {
  const [activeMode, setActiveMode] = useState<ModeKey>('haptic');
  const active = MODES.find((mode) => mode.key === activeMode) ?? MODES[0];

  return (
    <section className="mode-preview">
      <div className="mode-preview-head">
        <p className="mode-preview-kicker">Visual guide</p>
        <h3 className="mode-preview-title">What each alert mode looks like</h3>
        <p className="mode-preview-copy">
          Tap a mode to see how it behaves. These controls live on the map screen.
        </p>
      </div>


      <div className="mode-container">
        <div className="mode-selector" role="group" aria-label="Alert mode preview">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              className={`mode-selector-btn ${activeMode === mode.key ? 'mode-selector-btn--active' : ''}`}
              onClick={() => setActiveMode(mode.key)}
              aria-pressed={activeMode === mode.key}
            >
              <Icon name={mode.icon} size={16} />
              <span>{mode.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <article className="mode-stage" aria-live="polite">
          <div className="mode-stage-visual">
            <ModeVisual mode={active.key} compact />
          </div>

          <div className="mode-stage-body">
            <h4 className="mode-stage-title">{active.title}</h4>
            <p className="mode-stage-copy">{active.description}</p>
          </div>
        </article>
      </div>

      <style>{`
        .mode-preview {
          padding: 24px;
        }
        .mode-preview-head {
          text-align: left;
          margin-bottom: 24px;
        }
        .mode-preview-kicker {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--color-accent);
          margin-bottom: 8px;
        }
        .mode-preview-title {
          font-size: 20px;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .mode-preview-copy {
          color: var(--color-text-sub);
          line-height: 1.55;
          font-size: 14px;
        }


        .phone-preview {
          position: relative;
          width: 100%;
          max-width: 156px;
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
        }
        .phone-preview--compact {
          max-width: 126px;
        }
        .phone-body {
          position: relative;
          z-index: 2;
          width: 74px;
          height: 110px;
          border-radius: 22px;
          border: 2px solid rgba(255,255,255,0.18);
          background: rgba(10, 10, 10, 0.55);
          display: grid;
          place-items: center;
          color: var(--color-accent);
          box-shadow: 0 12px 30px rgba(0,0,0,0.3);
        }
        .phone-body--compact {
          width: 60px;
          height: 92px;
          border-radius: 18px;
        }
        .pulse,
        .voice-waves,
        .silent-map {
          position: absolute;
          inset: 0;
        }
        .pulse {
          border-radius: 50%;
          border: 2px solid rgba(6, 214, 160, 0.55);
          animation: pulse-ring 2.4s ease-out infinite;
        }
        .pulse-2 { animation-delay: 0.45s; }
        .pulse-3 { animation-delay: 0.9s; }
        .phone-preview--voice .voice-waves {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--color-accent);
        }
        .phone-preview--voice .voice-waves span {
          width: 6px;
          height: 28px;
          border-radius: 999px;
          background: currentColor;
          animation: wave 1s ease-in-out infinite;
        }
        .phone-preview--compact.phone-preview--voice .voice-waves {
          gap: 6px;
        }
        .phone-preview--compact.phone-preview--voice .voice-waves span {
          width: 5px;
          height: 22px;
        }
        .phone-preview--voice .voice-waves span:nth-child(2) { animation-delay: 0.15s; }
        .phone-preview--voice .voice-waves span:nth-child(3) { animation-delay: 0.3s; }
        .phone-preview--silent .silent-map {
          display: grid;
          place-items: center;
          background:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 18px 18px;
          border-radius: 24px;
          opacity: 0.7;
        }
        .silent-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-accent);
          box-shadow: 0 0 0 10px rgba(6, 214, 160, 0.08);
          position: relative;
        }
        .silent-line {
          position: absolute;
          height: 2px;
          border-radius: 999px;
          background: rgba(255,255,255,0.25);
        }
        .silent-line--1 { width: 58%; top: 30%; left: 21%; }
        .silent-line--2 { width: 44%; top: 56%; left: 10%; }
        .silent-line--3 { width: 38%; top: 72%; right: 10%; }

        .mode-selector {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        .mode-selector-btn {
          min-height: 44px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: var(--color-text-sub);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.01em;
        }
        .mode-selector-btn--active {
          background: rgba(6, 214, 160, 0.16);
          color: var(--color-accent);
          border-color: rgba(6, 214, 160, 0.55);
        }
        .mode-stage {
          border-radius: var(--radius-md);
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(24, 24, 27, 0.7);
          overflow: hidden;
        }
        .mode-stage-visual {
          min-height: 180px;
          display: grid;
          place-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background:
            radial-gradient(circle at center, rgba(6, 214, 160, 0.12), transparent 65%),
            rgba(255,255,255,0.02);
        }
        .mode-stage-body {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mode-stage-title {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .mode-stage-copy {
          font-size: 12px;
          line-height: 1.55;
          color: var(--color-text-sub);
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.78);
            opacity: 0.75;
          }
          100% {
            transform: scale(1.12);
            opacity: 0;
          }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.6); opacity: 0.55; }
          50% { transform: scaleY(1.4); opacity: 1; }
        }
        @media (max-width: 900px) {
          .mode-preview {
            padding: 16px;
            margin-top: 18px;
          }
          .mode-preview-head {
            margin-bottom: 14px;
          }
          .mode-preview-title {
            font-size: 17px;
          }
        }
        @media (max-width: 420px) {
          .mode-preview-copy {
            font-size: 12px;
          }
          .mode-selector {
            gap: 6px;
          }
          .mode-selector-btn {
            padding: 8px 8px;
            min-height: 40px;
            font-size: 11px;
          }
          .mode-stage-visual {
            min-height: 160px;
          }
          .mode-stage-body {
            padding: 12px;
          }
          .mode-stage-title {
            font-size: 14px;
          }
          .mode-stage-copy {
            font-size: 11px;
          }

          .phone-preview--compact {
            max-width: 116px;
          }
          .phone-body--compact {
            width: 56px;
            height: 84px;
            border-radius: 16px;
          }
        }
      `}</style>
    </section>
  );
}
