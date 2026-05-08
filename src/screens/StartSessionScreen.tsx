import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { supabase } from '../services/supabaseClient';
import { getUserName, getOrCreateDeviceId } from '../utils/deviceId';

export function StartSessionScreen() {
  const navigate = useNavigate();
  const [sessionName, setSessionName] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userName = getUserName();
      const deviceId = getOrCreateDeviceId();

      if (!sessionName.trim() || !source.trim() || !destination.trim()) {
        throw new Error('Please fill in all fields');
      }

      // Call RPC to create session
      const { data, error: rpcError } = await supabase.rpc('create_session', {
        p_creator_device_id: deviceId,
        p_creator_name: userName,
        p_session_name: sessionName.trim(),
        p_source: source.trim(),
        p_destination: destination.trim(),
      });

      if (rpcError) throw rpcError;
      if (!data || data.length === 0) throw new Error('Failed to create session');

      const { session_id, code } = data[0];
      setGeneratedCode(code);

      // Navigate to active ride after a brief delay to show the code
      setTimeout(() => {
        navigate(`/ride/${session_id}`);
      }, 2000);
    } catch (e) {
      console.error('Create session error:', e);
      setError(e instanceof Error ? e.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  if (generatedCode) {
    return (
      <div className="screen screen--center success-screen">
        <div className="success-content">
          <div className="success-icon">
            <Icon name="check" size={64} />
          </div>
          <h2>Session Created!</h2>
          <p className="code-label">Share this code with friends:</p>
          <div className="code-display">{generatedCode}</div>
          <button
            className="btn-primary"
            onClick={() => {
              navigator.clipboard.writeText(generatedCode);
              alert('Code copied to clipboard!');
            }}
          >
            <Icon name="copy" size={16} />
            Copy Code
          </button>
          <p className="success-note">Redirecting to your ride...</p>
        </div>

        <style>{`
          .success-screen {
            background: var(--color-bg);
          }
          .success-content {
            text-align: center;
          }
          .success-icon {
            color: var(--color-accent);
            margin-bottom: 24px;
          }
          .success-content h2 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 24px;
          }
          .code-label {
            color: var(--color-text-sub);
            margin-bottom: 16px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .code-display {
            font-family: var(--font-mono);
            font-size: 48px;
            font-weight: 800;
            color: var(--color-accent);
            letter-spacing: 0.2em;
            margin: 24px 0;
            padding: 24px;
            background: var(--color-surface);
            border-radius: 16px;
            border: 2px solid var(--color-accent);
          }
          .success-note {
            margin-top: 24px;
            color: var(--color-text-sub);
            font-size: 13px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="screen screen--scroll start-session-screen">
      <header className="session-header">
        <button
          className="btn-ghost"
          onClick={() => navigate('/')}
          style={{ marginBottom: '20px' }}
        >
          <Icon name="arrow-left" size={20} />
          Back
        </button>
        <h1>Start a New Ride</h1>
        <p>Set up your session details</p>
      </header>

      <form onSubmit={handleCreateSession} className="session-form">
        <div className="input-group">
          <label className="input-label">Ride Name</label>
          <input
            className="text-input"
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="e.g., Friday Evening Ride"
            maxLength={50}
            required
            autoFocus
          />
        </div>

        <div className="input-group">
          <label className="input-label">Starting From</label>
          <input
            className="text-input"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., Tech Park, Bangalore"
            maxLength={80}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Going To</label>
          <input
            className="text-input"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g., Indiranagar Lake"
            maxLength={80}
            required
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          className="btn-primary btn-xl"
          type="submit"
          disabled={loading || !sessionName.trim() || !source.trim() || !destination.trim()}
          style={{ width: '100%', marginTop: '32px' }}
        >
          {loading ? 'Creating Session…' : 'Create & Start Ride'}
          <Icon name="arrow-right" size={20} />
        </button>
      </form>

      <style>{`
        .start-session-screen {
          padding-bottom: 60px;
        }
        .session-header {
          margin-bottom: 40px;
        }
        .session-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .session-header p {
          color: var(--color-text-sub);
          font-size: 14px;
        }
        .session-form {
          max-width: 500px;
        }
      `}</style>
    </div>
  );
}
