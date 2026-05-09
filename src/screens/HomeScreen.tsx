import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { supabase } from '../services/supabaseClient';
import { Icon } from '../components/ui/Icon';
import type { AppUser } from '../types';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A8E6CF',
];

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function HomeScreen() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const roomList = useAppStore((s) => s.roomList);
  const setUser = useAppStore((s) => s.setUser);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);

  const [showNameSetup, setShowNameSetup] = useState(!user);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // If user exists and has rooms, hide the name setup
  useEffect(() => {
    if (user && roomList.length > 0) {
      setShowNameSetup(false);
    }
  }, [user, roomList]);

  const handleSetupName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setNameLoading(true);

    try {
      if (!name.trim() || name.trim().length < 2) {
        throw new Error('Please enter a valid name (at least 2 characters)');
      }

      if (name.trim().length > 30) {
        throw new Error('Name must be under 30 characters');
      }

      const userId = crypto.randomUUID();
      const avatarColor = getRandomColor();
      const displayName = name.trim();

      // Create user in Supabase
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          display_name: displayName,
          avatar_color: avatarColor,
        });

      if (userError) throw userError;

      // Update local state
      const newUser: AppUser = {
        id: userId,
        display_name: displayName,
        avatar_color: avatarColor,
        phone_hash: null,
        device_id: null,
      };

      setUser(newUser);
      setShowNameSetup(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to set up profile';
      setNameError(msg);
    } finally {
      setNameLoading(false);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setShowNameSetup(true);
  };

  const lastRoom = roomList.length > 0 ? roomList[0] : null;

  return (
    <div className="screen screen--scroll home-screen">
      {/* NAME SETUP MODAL */}
      {showNameSetup && (
        <div className="name-setup-overlay">
          <div className="name-setup-card">
            <h1 className="setup-title">Welcome to GroupTrace</h1>
            <p className="setup-subtitle">What's your name?</p>

            <form onSubmit={handleSetupName}>
              <input
                className="name-input"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoFocus
              />
              {nameError && <p className="error-text">{nameError}</p>}
              <button
                className="btn-primary btn-block"
                type="submit"
                disabled={nameLoading || name.trim().length < 2}
              >
                {nameLoading ? 'Setting up...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {!showNameSetup && user && (
        <>
          {/* HEADER */}
          <header className="home-header">
            <div className="user-profile-home">
              <div className="user-avatar-home" style={{ background: user.avatar_color }}>
                {user.display_name?.charAt(0)}
              </div>
              <div className="user-info-home">
                <span className="user-greeting">Welcome back,</span>
                <h1 className="screen-title">{user.display_name}</h1>
              </div>
            </div>

            <button className="btn-ghost btn-sm" onClick={handleSignOut}>
              <Icon name="log-out" size={18} />
            </button>
          </header>

          {/* CONTENT */}
          <div className="home-content">
            {/* LAST ROOM / RESUME */}
            {lastRoom && (
              <section className="home-section">
                <h2 className="section-title">Resume</h2>
                <button
                  className="resume-card"
                  onClick={async () => {
                    try {
                      // Fetch full room data including settings
                      const { data: roomData } = await supabase
                        .from('rooms')
                        .select('*')
                        .eq('id', lastRoom.id)
                        .single();

                      if (roomData) {
                        useAppStore.setState({
                          activeRoom: {
                            id: roomData.id,
                            code: roomData.code,
                            name: roomData.name,
                            context: roomData.context,
                            organizer_id: roomData.organizer_id,
                            settings: roomData.settings,
                            myRole: lastRoom.myRole,
                          },
                        });
                        navigate('/ride-setup');
                      }
                    } catch (err) {
                      console.error('[HomeScreen] Failed to resume room:', err);
                    }
                  }}
                >
                  <div className="resume-badge">Last Used</div>
                  <div className="room-info-resume">
                    <h3>{lastRoom.name}</h3>
                    <p>{lastRoom.code} • {lastRoom.context}</p>
                  </div>
                  <Icon name="arrow-right" size={20} />
                </button>
              </section>
            )}

            {/* RECENT ROOMS LIST */}
            {roomList.length > 1 && (
              <section className="home-section">
                <h2 className="section-title">Other Rooms</h2>
                <div className="rooms-list">
                  {roomList.slice(1).map((room) => (
                    <button
                      key={room.id}
                      className="room-card"
                      onClick={async () => {
                        try {
                          // Fetch full room data including settings
                          const { data: roomData } = await supabase
                            .from('rooms')
                            .select('*')
                            .eq('id', room.id)
                            .single();

                          if (roomData) {
                            useAppStore.setState({
                              activeRoom: {
                                id: roomData.id,
                                code: roomData.code,
                                name: roomData.name,
                                context: roomData.context,
                                organizer_id: roomData.organizer_id,
                                settings: roomData.settings,
                                myRole: room.myRole,
                              },
                            });
                            navigate('/ride-setup');
                          }
                        } catch (err) {
                          console.error('[HomeScreen] Failed to resume room:', err);
                        }
                      }}
                    >
                      <div className="room-card-header">
                        <h3>{room.name}</h3>
                        <span className="room-code">{room.code}</span>
                      </div>
                      <div className="room-card-footer">
                        <span className="context-badge">{room.context}</span>
                        <span className="role-badge">{room.myRole}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* NEW ROOM ACTIONS */}
            <section className="home-section">
              <h2 className="section-title">Start New</h2>
              <div className="action-grid">
                <button
                  className="action-btn action-btn--create"
                  onClick={() => navigate('/create')}
                >
                  <Icon name="plus" size={24} />
                  <span>Create Room</span>
                </button>
                <button
                  className="action-btn action-btn--join"
                  onClick={() => navigate('/join')}
                >
                  <Icon name="key" size={24} />
                  <span>Join Room</span>
                </button>
              </div>
            </section>

            {/* EMPTY STATE */}
            {roomList.length === 0 && (
              <section className="home-section empty-state-section">
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="map" size={48} /></div>
                  <h3>No rooms yet</h3>
                  <p>Create a new room or join one with a code to get started</p>
                </div>
              </section>
            )}
          </div>
        </>
      )}

      <style>{`
        .home-screen {
          background: var(--color-bg);
        }

        .name-setup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .name-setup-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 40px 32px;
          max-width: 400px;
          width: 100%;
          box-shadow: var(--shadow-xl);
        }

        .setup-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .setup-subtitle {
          font-size: 14px;
          color: var(--color-text-sub);
          margin-bottom: 32px;
        }

        .name-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 12px 16px;
          color: #fff;
          font-size: 16px;
          margin-bottom: 16px;
          transition: border-color 0.2s;
        }

        .name-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .name-input:focus {
          border-color: var(--color-accent);
          outline: none;
        }

        .btn-block {
          width: 100%;
          margin-top: 8px;
        }

        .home-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
          background: rgba(0, 0, 0, 0.2);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
        }

        .user-profile-home {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-avatar-home {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
          color: #fff;
          box-shadow: var(--shadow-lg);
        }

        .user-info-home {
          display: flex;
          flex-direction: column;
        }

        .user-greeting {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-text-sub);
          margin-bottom: 2px;
        }

        .home-content {
          padding: 24px 16px;
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding-bottom: 80px;
        }

        .home-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-text-sub);
        }

        .resume-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(6, 214, 160, 0.1), rgba(124, 58, 237, 0.05));
          border: 1px solid var(--color-accent);
          border-radius: 16px;
          text-align: left;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .resume-card:hover {
          background: linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(124, 58, 237, 0.1));
          border-color: var(--color-accent);
        }

        .resume-badge {
          position: absolute;
          top: -12px;
          left: 16px;
          font-size: 10px;
          font-weight: 800;
          background: var(--color-accent);
          color: #000;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .room-info-resume {
          margin-top: 12px;
          flex: 1;
        }

        .room-info-resume h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .room-info-resume p {
          font-size: 12px;
          color: var(--color-text-sub);
        }

        .rooms-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .room-card {
          padding: 14px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          text-align: left;
          transition: all 0.2s;
        }

        .room-card:hover {
          background: var(--color-surface-2);
          border-color: var(--color-accent);
        }

        .room-card-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
          gap: 12px;
        }

        .room-card-header h3 {
          font-size: 15px;
          font-weight: 700;
          flex: 1;
        }

        .room-code {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--color-accent);
          font-weight: 700;
        }

        .room-card-footer {
          display: flex;
          gap: 8px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-sub);
        }

        .context-badge,
        .role-badge {
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .action-btn:hover {
          background: var(--color-surface-2);
          border-color: var(--color-accent);
          color: var(--color-accent);
        }

        .action-btn--create {
          border-color: rgba(6, 214, 160, 0.3);
        }

        .action-btn--join {
          border-color: rgba(124, 58, 237, 0.3);
        }

        .empty-state-section {
          margin-top: 60px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          margin-bottom: 24px;
          opacity: 0.3;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .empty-state p {
          font-size: 14px;
          color: var(--color-text-sub);
        }

        @media (max-width: 600px) {
          .home-content {
            padding: 16px;
            gap: 24px;
          }

          .name-setup-card {
            padding: 32px 20px;
          }

          .action-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
