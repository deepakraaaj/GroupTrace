import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { Icon } from '../ui/Icon';

interface Props {
  onJoin: (code: string) => void;
  loading: boolean;
  error?: string;
}

export function GroupPairing({ onJoin, loading, error }: Props) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(code.toUpperCase());
  };

  return (
    <div className="pairing-container">
      <header className="pairing-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="pairing-icon-box">
          <Icon name="plus" size={32} />
        </div>
        <h2 className="section-title">Join Existing Group</h2>
        <p className="section-sub" style={{ margin: '0 auto' }}>Enter the 4-digit code shared by the group organizer.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Group Access Code</label>
          <input
            className="pin-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            maxLength={4}
            autoFocus
            required
          />
        </div>

        {error && <p className="error-text" style={{ textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

        <button 
          className="btn-primary btn-xl" 
          type="submit" 
          disabled={loading || code.length < 4}
          style={{ width: '100%' }}
        >
          {loading ? 'Validating Access…' : 'Enter Group'}
          <Icon name="compass" size={20} />
        </button>
      </form>

      <style>{`
        .pairing-icon-box {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: var(--color-surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          margin: 0 auto 20px;
          border: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
}
