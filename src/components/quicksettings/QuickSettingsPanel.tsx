import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { triggerHaptic } from '../../services/hapticFeedback';
import { Icon } from '../ui/Icon';

interface Props {
  onClose: () => void;
  onPause: () => void;
  onStop: () => Promise<void>;
}

export function QuickSettingsPanel({ onClose, onPause, onStop }: Props) {
  const isAlertsMuted         = useAppStore((s) => s.isAlertsMuted);
  const setAlertsMuted        = useAppStore((s) => s.setAlertsMuted);
  const isPaused              = useAppStore((s) => s.isPaused);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleStop = async () => {
    await triggerHaptic('confirmed');
    await onStop();
    onClose();
  };

  const handleSilence = async () => {
    const next = !isAlertsMuted;
    setAlertsMuted(next);
    await triggerHaptic('confirmed');
  };

  const handlePause = async () => {
    onPause();
    await triggerHaptic('confirmed');
    onClose();
  };

  return (
    <div className="quick-settings-content">
      <div className="qs-drag-handle" />
      
      <header className="qs-header">
        <div className="qs-header-info">
          <p className="qs-kicker">Ride Controls</p>
          <h2 className="qs-title">Quick Settings</h2>
        </div>
        <button className="btn-ghost btn-sm" onClick={onClose}>
           <Icon name="check" size={24} className="text-accent" />
        </button>
      </header>

      <div className="qs-sections">
        <section className="qs-section">
          <h3 className="qs-section-title">Alerts & Status</h3>
          <div className="qs-grid">
            <button 
              className={`qs-action-card ${isAlertsMuted ? 'active' : ''}`}
              onClick={handleSilence}
            >
              <div className="qs-action-icon">
                <Icon name={isAlertsMuted ? 'silence' : 'volume'} size={20} />
              </div>
              <div className="qs-action-text">
                <strong>{isAlertsMuted ? 'Muted' : 'Unmuted'}</strong>
                <span>Silence ride alerts</span>
              </div>
            </button>

            <button 
              className={`qs-action-card ${isPaused ? 'active' : ''}`}
              onClick={handlePause}
              disabled={isPaused}
            >
              <div className="qs-action-icon">
                <Icon name="silence" size={20} />
              </div>
              <div className="qs-action-text">
                <strong>{isPaused ? 'Paused' : 'Pause 5m'}</strong>
                <span>Temporary stop</span>
              </div>
            </button>
          </div>
        </section>

        <section className="qs-section danger-section">
          <button className="btn-primary btn-xl btn-danger-style" onClick={handleStop}>
            <Icon name="log-out" size={20} />
            End Tracking Session
          </button>
          <p className="qs-help-text">This will immediately stop sharing your location with the group.</p>
        </section>
      </div>

      <style>{`
        .quick-settings-content {
          color: var(--color-text);
        }
        .qs-drag-handle {
          width: 40px;
          height: 4px;
          background: var(--color-surface-3);
          border-radius: 2px;
          margin: 0 auto 24px;
        }
        .qs-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .qs-kicker {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-accent);
          margin-bottom: 4px;
        }
        .qs-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .qs-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .qs-section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-sub);
          margin-bottom: 16px;
        }
        .qs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .qs-action-card {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
          transition: var(--transition);
        }
        .qs-action-card.active {
          background: rgba(6, 214, 160, 0.1);
          border-color: var(--color-accent);
        }
        .qs-action-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--color-surface-3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-sub);
        }
        .qs-action-card.active .qs-action-icon {
          background: var(--color-accent);
          color: #000;
        }
        .qs-action-text strong {
          display: block;
          font-size: 14px;
          margin-bottom: 2px;
        }
        .qs-action-text span {
          font-size: 11px;
          color: var(--color-text-sub);
        }
        .btn-danger-style {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--color-alert);
          width: 100%;
          box-shadow: none;
        }
        .btn-danger-style:hover {
          background: var(--color-alert);
          color: #fff;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
        }
        .qs-help-text {
          font-size: 12px;
          color: var(--color-muted);
          text-align: center;
          margin-top: 12px;
        }
        .text-accent { color: var(--color-accent); }
      `}</style>
    </div>
  );
}
