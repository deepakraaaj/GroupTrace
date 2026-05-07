import { useState } from 'react';
import { ContextPicker } from '../onboarding/ContextPicker';
import type { GroupContext } from '../../types';
import { Icon } from '../ui/Icon';

interface Props {
  onCreate: (name: string, context: GroupContext) => Promise<{ shortCode: string }>;
  loading: boolean;
  error: string;
}

export function GroupCreator({ onCreate, loading, error }: Props) {
  const [name, setName]       = useState('');
  const [context, setContext] = useState<GroupContext | null>(null);
  const [code, setCode]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !context) return;
    const result = await onCreate(name.trim(), context);
    setCode(result.shortCode);
  };

  if (code) {
    return (
      <div className="creator-container success-state">
        <div className="success-icon">
          <Icon name="check" size={32} />
        </div>
        <h2 className="section-title">Session Initialized</h2>
        <p className="section-sub">Share this access code with your group.</p>
        
        <div className="code-hero-card">
          <span className="code-label">ACCESS CODE</span>
          <strong className="code-value">{code}</strong>
          <button className="btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(code)}>
            <Icon name="copy" size={14} />
            Copy Code
          </button>
        </div>
        
        <p className="code-hint">Participants must enter this code in the "Join" screen to link devices.</p>
      </div>
    );
  }

  return (
    <div className="creator-container">
      <header className="creator-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="creator-icon-box">
          <Icon name="users" size={32} />
        </div>
        <h2 className="section-title">New Tracking Group</h2>
        <p className="section-sub" style={{ margin: '0 auto' }}>Define your group identity and trip context.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Mission Name</label>
          <input
            className="text-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Highway Patrol, Weekend Trek"
            maxLength={60}
            autoFocus
            required
          />
        </div>

        <ContextPicker value={context} onChange={setContext} />

        {error && <p className="error-text" style={{ textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

        <button
          className="btn-primary btn-xl"
          type="submit"
          disabled={loading || !name.trim() || !context}
          style={{ width: '100%', marginTop: '16px' }}
        >
          {loading ? 'Initializing…' : 'Finalize & Create'}
          <Icon name="plus" size={20} />
        </button>
      </form>

      <style>{`
        .creator-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        .creator-icon-box {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: var(--color-surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          margin: 0 auto 24px;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        .success-state {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 500px;
        }
        .success-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(6, 214, 160, 0.1);
          color: var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
          border: 2px solid var(--color-accent);
          box-shadow: 0 0 30px rgba(6, 214, 160, 0.2);
        }
        .code-hero-card {
          width: 100%;
          background: linear-gradient(180deg, var(--color-surface-2), var(--color-bg));
          border: 1px solid var(--color-border);
          border-radius: 24px;
          padding: 48px 32px;
          margin: 32px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-xl);
        }
        .code-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.3em;
          color: var(--color-accent);
          text-transform: uppercase;
        }
        .code-value {
          font-size: 64px;
          font-family: var(--font-mono);
          letter-spacing: 0.25em;
          color: #fff;
          text-shadow: 0 0 40px rgba(6, 214, 160, 0.4);
          line-height: 1;
        }
        .code-hint {
          font-size: 15px;
          color: var(--color-text-sub);
          line-height: 1.6;
          max-width: 400px;
        }

        @media (max-width: 600px) {
          .creator-container {
            padding: 24px 16px;
          }
          .section-title {
            font-size: 28px;
          }
          .code-value {
            font-size: 44px;
            letter-spacing: 0.15em;
          }
          .code-hero-card {
            padding: 32px 20px;
          }
        }
      `}</style>
    </div>
  );
}
