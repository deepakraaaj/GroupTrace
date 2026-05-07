import type { GroupContext } from '../../types';
import { CONTEXT_META } from '../../types';
import { Icon } from '../ui/Icon';

interface Props {
  value: GroupContext | null;
  onChange: (ctx: GroupContext) => void;
}

const CONTEXTS = Object.entries(CONTEXT_META) as Array<[GroupContext, typeof CONTEXT_META[GroupContext]]>;

export function ContextPicker({ value, onChange }: Props) {
  return (
    <div className="context-picker-modern">
      <label className="input-label">Select Group Context</label>
      <div className="context-grid">
        {CONTEXTS.map(([key, meta]) => (
          <button
            key={key}
            className={`context-card ${value === key ? 'context-card--selected' : ''}`}
            onClick={() => onChange(key)}
            type="button"
          >
            <div className="context-icon-wrap">
              <Icon name={meta.icon as any} size={20} />
            </div>
            <div className="context-body">
              <span className="context-label">{meta.label}</span>
              <span className="context-desc">{meta.description}</span>
            </div>
            <div className="context-check">
              <Icon name="check" size={10} />
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .context-picker-modern {
          margin-bottom: 24px;
        }
        .context-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        @media (max-width: 600px) {
          .context-grid {
            grid-template-columns: 1fr;
          }
          .context-card {
            padding: 12px;
          }
        }
        .context-card {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
          position: relative;
          transition: var(--transition-fast);
        }
        .context-card:hover {
          border-color: rgba(255,255,255,0.2);
          background: var(--color-surface-3);
        }
        .context-card--selected {
          background: rgba(6, 214, 160, 0.05);
          border-color: var(--color-accent);
          box-shadow: 0 0 20px rgba(6, 214, 160, 0.1);
        }
        .context-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--color-surface-3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-sub);
          flex-shrink: 0;
          transition: var(--transition-fast);
        }
        .context-card--selected .context-icon-wrap {
          background: var(--color-accent);
          color: #000;
        }
        .context-label {
          display: block;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .context-desc {
          font-size: 12px;
          color: var(--color-text-sub);
        }
        .context-check {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-surface-3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: var(--transition-fast);
        }
        .context-card--selected .context-check {
          background: var(--color-accent);
          color: #000;
        }
      `}</style>
    </div>
  );
}
