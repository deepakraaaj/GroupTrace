import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { supabase } from '../services/supabaseClient';
import { getUserName, getOrCreateDeviceId } from '../utils/deviceId';

export function JoinSessionScreen() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!code.trim() || code.length !== 5) {
        throw new Error('Code must be 1 letter + 4 digits (e.g., A1234)');
      }

      const userName = getUserName();
      const deviceId = getOrCreateDeviceId();

      // Call RPC to join session
      const { data, error: rpcError } = await supabase.rpc('join_session_by_code', {
        p_device_id: deviceId,
        p_name: userName,
        p_code: code.toUpperCase(),
      });

      if (rpcError) throw rpcError;
      if (!data || data.length === 0) throw new Error('Failed to join session');

      const { session_id } = data[0];
      navigate(`/ride/${session_id}`);
    } catch (e) {
      console.error('Join session error:', e);
      setError(e instanceof Error ? e.message : 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen screen--center join-session-screen">
      <header className="join-header">
        <button
          className="btn-ghost"
          onClick={() => navigate('/')}
          style={{ marginBottom: '40px', width: '100%' }}
        >
          <Icon name="arrow-left" size={20} />
          Back
        </button>
      </header>

      <div className="join-content">
        <div className="join-icon">
          <Icon name="key" size={48} />
        </div>
        <h1>Join a Ride</h1>
        <p className="join-sub">Enter the session code shared by the ride organizer</p>

        <form onSubmit={handleJoinSession} style={{ width: '100%' }}>
          <div className="input-group">
            <label className="input-label">Session Code</label>
            <input
              className="code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="A1234"
              maxLength={5}
              autoFocus
              required
            />
            <p className="input-hint">Format: 1 letter + 4 digits</p>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn-primary btn-xl"
            type="submit"
            disabled={loading || code.length !== 5}
            style={{ width: '100%', marginTop: '32px' }}
          >
            {loading ? 'Joining…' : 'Join Ride'}
            <Icon name="arrow-right" size={20} />
          </button>
        </form>
      </div>

      <style>{`
        .join-session-screen {
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .join-header {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          z-index: 10;
        }
        .join-content {
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        .join-icon {
          color: var(--color-accent);
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
        }
        .join-content h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .join-sub {
          font-size: 14px;
          color: var(--color-text-sub);
          margin-bottom: 40px;
        }
        .code-input {
          font-family: var(--font-mono);
          font-size: 48px;
          letter-spacing: 0.3em;
          text-align: center;
          font-weight: 800;
          background: transparent;
          border: none;
          border-bottom: 2px solid var(--color-border);
          padding: 12px 0;
          width: 100%;
          color: var(--color-accent);
          transition: border-color 0.2s;
        }
        .code-input:focus {
          outline: none;
          border-bottom-color: var(--color-accent);
        }
        .code-input::placeholder {
          color: rgba(255, 255, 255, 0.1);
        }
        .input-hint {
          font-size: 12px;
          color: var(--color-text-sub);
          margin-top: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
