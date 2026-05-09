import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { supabase } from '../services/supabaseClient';
import { CONTEXT_META } from '../types';
import type { GroupContext } from '../types';
import { Icon } from '../components/ui/Icon';

function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const digits = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');
  return letter + digits;
}

type Step = 'setup' | 'details' | 'share';

export function CreateRoomScreen() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const setActiveRoom = useAppStore((s) => s.setActiveRoom);
  const addRoomToList = useAppStore((s) => s.addRoomToList);

  const [step, setStep] = useState<Step>('details');
  const [roomName, setRoomName] = useState('');
  const [context, setContext] = useState<GroupContext>('biker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      if (!roomName.trim() || roomName.trim().length < 2) {
        throw new Error('Please enter a room name (at least 2 characters)');
      }

      let code = generateRoomCode();
      let retries = 5;

      // Try to generate a unique code
      while (retries > 0) {
        const { data: existing } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', code)
          .maybeSingle();

        if (!existing) break;
        code = generateRoomCode();
        retries--;
      }

      if (retries === 0) {
        throw new Error('Failed to generate unique room code');
      }

      // Create room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code,
          name: roomName.trim(),
          context,
          organizer_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add organizer as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          role: 'organizer',
        });

      if (memberError) throw memberError;

      // Update local state
      setRoomCode(code);
      setRoomId(roomData.id);
      setStep('share');

      setActiveRoom({
        id: roomData.id,
        code,
        name: roomData.name,
        context,
        organizer_id: user.id,
        settings: roomData.settings || {
          separationThresholdMeters: 100,
          syncThresholdMeters: 20,
          syncThresholdSeconds: 30,
        },
        myRole: 'organizer',
      });

      addRoomToList({
        id: roomData.id,
        code,
        name: roomData.name,
        context,
        myRole: 'organizer',
        last_seen_at: new Date().toISOString(),
        is_active: true,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create room';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}?join=${roomCode}`;
    const text = `Join my GroupTrace room! Code: ${roomCode}`;

    if (navigator.share) {
      navigator.share({
        title: 'GroupTrace',
        text,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  const contextItems = (Object.keys(CONTEXT_META) as GroupContext[]).map((ctx) => ({
    id: ctx,
    label: CONTEXT_META[ctx].label,
    icon: CONTEXT_META[ctx].icon,
  }));

  return (
    <div className="screen screen--scroll create-room-screen">
      <header className="screen-header" style={{ justifyContent: 'flex-start', padding: '24px 32px' }}>
        {step !== 'share' ? (
          <button className="btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <Icon name="arrow-left" size={20} />
            <span>Cancel</span>
          </button>
        ) : null}
        <div style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '12px', letterSpacing: '0.1em' }}>
          {step === 'details' ? 'CREATE ROOM' : 'SHARE'}
        </div>
      </header>

      <div className="create-content">
        {step === 'details' && (
          <div className="form-section fade-in">
            <div className="form-header">
              <h2>Create a New Room</h2>
              <p>Give your room a name and pick an activity type</p>
            </div>

            <form onSubmit={handleCreate} className="form-body">
              <div className="form-group">
                <label className="input-label">Room Name</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="e.g., Weekend Ride"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={50}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="input-label">Activity Type</label>
                <div className="context-grid">
                  {contextItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`context-option ${context === item.id ? 'active' : ''}`}
                      onClick={() => setContext(item.id)}
                    >
                      <Icon name={item.icon} size={20} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button
                className="btn-primary btn-block"
                type="submit"
                disabled={loading || !roomName.trim()}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        )}

        {step === 'share' && (
          <div className="share-section fade-in">
            <div className="share-header">
              <div className="check-icon">
                <Icon name="check-circle" size={48} />
              </div>
              <h2>Room Created!</h2>
              <p>Share this code with others to let them join</p>
            </div>

            <div className="code-display">
              <div className="code-label">Code</div>
              <div className="code-value">{roomCode}</div>
              <button
                className="btn-secondary btn-sm"
                onClick={() => navigator.clipboard.writeText(roomCode)}
              >
                <Icon name="copy" size={16} />
                Copy
              </button>
            </div>

            <div className="share-actions">
              <button className="btn-primary btn-block" onClick={handleShareLink}>
                <Icon name="share-2" size={18} />
                Share Link
              </button>
              <button
                className="btn-secondary btn-block"
                onClick={() => navigate('/ride-setup')}
              >
                Start Ride
              </button>
            </div>

            <div className="share-info">
              <Icon name="info" size={16} />
              <span>Others can join using the 5-digit code or the shared link</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .create-room-screen {
          background: var(--color-bg);
        }

        .create-content {
          padding: 40px 20px;
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: 80px;
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-header h2 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .form-header p {
          font-size: 14px;
          color: var(--color-text-sub);
        }

        .form-body {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .input-label {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-sub);
        }

        .input-field {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          color: #fff;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          border-color: var(--color-accent);
          outline: none;
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        .context-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }

        .context-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: 14px;
          color: var(--color-text-sub);
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          transition: all 0.2s;
          cursor: pointer;
        }

        .context-option:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
        }

        .context-option.active {
          background: rgba(6, 214, 160, 0.15);
          border-color: var(--color-accent);
          color: var(--color-accent);
        }

        .btn-block {
          width: 100%;
        }

        .share-section {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .share-header {
          text-align: center;
        }

        .check-icon {
          margin-bottom: 16px;
          color: var(--color-accent);
        }

        .share-header h2 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .share-header p {
          font-size: 14px;
          color: var(--color-text-sub);
        }

        .code-display {
          background: var(--color-surface);
          border: 2px dashed var(--color-border);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .code-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-sub);
        }

        .code-value {
          font-family: var(--font-mono);
          font-size: 48px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: var(--color-accent);
        }

        .share-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .share-info {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 12px;
          color: var(--color-text-sub);
          line-height: 1.5;
        }

        .share-info svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: var(--color-accent);
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
          .create-content {
            padding: 24px 16px;
          }

          .context-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .code-value {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}
