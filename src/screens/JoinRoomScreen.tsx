import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { supabase } from '../services/supabaseClient';
import type { GroupContext } from '../types';
import { Icon } from '../components/ui/Icon';

export function JoinRoomScreen() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const setActiveRoom = useAppStore((s) => s.setActiveRoom);
  const addRoomToList = useAppStore((s) => s.addRoomToList);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const upperCode = code.toUpperCase().trim();

      if (!upperCode || upperCode.length !== 5) {
        throw new Error('Please enter a 5-character room code');
      }

      if (!/^[A-Z]\d{4}$/.test(upperCode)) {
        throw new Error('Invalid code format (e.g., K7392)');
      }

      // Find room by code
      const { data: roomData, error: fetchError } = await supabase
        .from('rooms')
        .select('id, code, name, context, organizer_id, settings, is_active')
        .eq('code', upperCode)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!roomData) {
        throw new Error('Room not found. Check the code and try again.');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('room_members')
        .upsert({
          room_id: roomData.id,
          user_id: user.id,
          role: 'member',
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'room_id,user_id' });

      if (memberError) throw memberError;

      // Update local state
      setActiveRoom({
        id: roomData.id,
        code: roomData.code,
        name: roomData.name,
        context: roomData.context as GroupContext,
        organizer_id: roomData.organizer_id,
        settings: roomData.settings || {
          separationThresholdMeters: 100,
          syncThresholdMeters: 20,
          syncThresholdSeconds: 30,
        },
        myRole: 'member',
      });

      addRoomToList({
        id: roomData.id,
        code: roomData.code,
        name: roomData.name,
        context: roomData.context as GroupContext,
        myRole: 'member',
        last_seen_at: new Date().toISOString(),
        is_active: roomData.is_active,
      });

      navigate('/ride-setup');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to join room';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen screen--center join-room-screen">
      <header className="screen-header" style={{ justifyContent: 'flex-start', padding: '24px 32px' }}>
        <button className="btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <Icon name="arrow-left" size={20} />
          <span>Cancel</span>
        </button>
        <div style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '12px', letterSpacing: '0.1em' }}>
          JOIN ROOM
        </div>
      </header>

      <div className="join-content">
        <div className="join-card fade-in">
          <div className="join-header">
            <div className="join-icon"><Icon name="key" size={40} /></div>
            <h2>Join a Room</h2>
            <p>Enter the 5-character code shared by the room organizer</p>
          </div>

          <form onSubmit={handleJoin} className="join-form">
            <div className="code-input-wrapper">
              <input
                className="code-input"
                type="text"
                placeholder="E.g., K7392"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  // Allow only letters and numbers
                  const filtered = val.replace(/[^A-Z0-9]/g, '').slice(0, 5);
                  setCode(filtered);
                }}
                maxLength={5}
                autoFocus
                autoCapitalize="characters"
                inputMode="text"
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              className="btn-primary btn-block"
              type="submit"
              disabled={loading || code.length < 5}
            >
              {loading ? 'Joining...' : 'Join Room'}
              <Icon name="arrow-right" size={20} />
            </button>

            <p className="join-hint">
              <Icon name="info" size={16} />
              Ask the organizer for the room code
            </p>
          </form>

          <div className="divider">OR</div>

          <button
            className="btn-secondary btn-block"
            onClick={() => navigate('/')}
          >
            <Icon name="plus" size={18} />
            Create a New Room
          </button>
        </div>
      </div>

      <style>{`
        .join-room-screen {
          background:
            radial-gradient(circle at 0% 0%, rgba(6, 214, 160, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.1) 0%, transparent 40%),
            var(--color-bg);
          position: relative;
        }

        .join-content {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 80px);
        }

        .join-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 32px 24px;
          width: 100%;
          max-width: 400px;
          box-shadow: var(--shadow-xl);
        }

        .join-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .join-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: rgba(6, 214, 160, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          margin: 0 auto 16px;
        }

        .join-header h2 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .join-header p {
          font-size: 14px;
          color: var(--color-text-sub);
        }

        .join-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .code-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .code-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 2px solid var(--color-border);
          font-family: var(--font-mono);
          font-size: 48px;
          text-align: center;
          color: #fff;
          letter-spacing: 0.2em;
          padding: 12px 0;
          transition: border-color 0.3s;
        }

        .code-input:focus {
          border-color: var(--color-accent);
          outline: none;
        }

        .code-input::placeholder {
          color: rgba(255, 255, 255, 0.1);
          font-size: 36px;
        }

        .join-hint {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--color-text-sub);
          line-height: 1.4;
        }

        .join-hint svg {
          flex-shrink: 0;
        }

        .btn-block {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .divider {
          text-align: center;
          color: var(--color-text-sub);
          font-size: 12px;
          margin: 16px 0;
          position: relative;
        }

        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          height: 1px;
          background: var(--color-border);
          width: calc(50% - 20px);
          top: 50%;
        }

        .divider::before {
          left: 0;
        }

        .divider::after {
          right: 0;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 600px) {
          .join-card {
            padding: 24px 16px;
          }

          .code-input {
            font-size: 36px;
          }

          .code-input::placeholder {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}
