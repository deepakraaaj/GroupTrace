import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Icon } from '../components/ui/Icon';
import { supabase } from '../services/supabaseClient';

export function GroupSelectionScreen() {
  const navigate       = useNavigate();
  const user           = useAppStore((s) => s.user);
  const groupList      = useAppStore((s) => s.groupList);
  const [partnerPin, setPartnerPin] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const myPin = localStorage.getItem('grouptrace_pin');

  const handlePairWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!partnerPin || partnerPin.length !== 4 || !/^\d{4}$/.test(partnerPin)) {
        throw new Error('Enter your partner\'s 4-digit PIN');
      }

      if (partnerPin === myPin) {
        throw new Error('You cannot pair with your own PIN');
      }

      if (!user?.id) {
        throw new Error('You must be signed in to pair');
      }

      // 1. Find the group by short_code (PIN) — no RPC needed
      const { data: groupData, error: fetchError } = await supabase
        .from('groups')
        .select('id, short_code, name, context, organizer_id, settings')
        .eq('short_code', partnerPin)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!groupData) {
        throw new Error('No one has signed in with that PIN yet. Make sure your partner has signed in first.');
      }

      console.log('[Pairing] Found group:', groupData.id);

      // 2. Add ourselves as a member (upsert is idempotent)
      const { error: memberError } = await supabase
        .from('group_members')
        .upsert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'member',
          is_active: true,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'group_id,user_id' });

      if (memberError) {
        console.error('[Pairing] Member upsert error:', memberError);
        throw memberError;
      }

      console.log('[Pairing] Joined group as member');

      useAppStore.setState({
        activeGroup: {
          id:           groupData.id,
          short_code:   groupData.short_code,
          name:         groupData.name,
          context:      groupData.context,
          organizer_id: groupData.organizer_id,
          settings:     groupData.settings,
          myRole: 'member',
        },
      });

      navigate('/ride-setup');
    } catch (e: unknown) {
      console.error('Pairing Error:', e);
      setError(e instanceof Error ? e.message : 'Pairing failed. Make sure your partner has signed in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('grouptrace_pin');
    localStorage.removeItem('grouptrace_name');
    localStorage.removeItem('grouptrace_color');
    useAppStore.setState({ user: null });
    navigate('/auth', { replace: true });
  };

  return (
    <div className="screen screen--scroll dashboard-screen">
      <header className="dash-header">
        <div className="user-profile">
          <div className="user-avatar" style={{ background: user?.avatar_color }}>
            {user?.display_name?.charAt(0)}
          </div>
          <div className="user-info">
            <span className="user-greeting">Welcome back,</span>
            <h1 className="screen-title">{user?.display_name}</h1>
          </div>
        </div>

        <div className="header-actions">
          <div className="compact-pin">
            <span className="pin-label">MY PIN</span>
            <strong className="pin-val">{myPin}</strong>
            <button className="pin-copy-btn" onClick={() => navigator.clipboard.writeText(myPin || '')}>
              <Icon name="copy" size={14} />
            </button>
          </div>
          <button className="btn-ghost btn-sm" onClick={handleSignOut}>
            <Icon name="log-out" size={18} />
          </button>
        </div>
      </header>

      <div className="dash-content">
        <div className="dash-grid">
          {/* LEFT: RECENT GROUPS */}
          <section className="dash-col dash-col--recent">
            <div className="col-header">
              <h2 className="col-title">Recent Connections</h2>
              <p className="col-sub">Jump back into your active circles.</p>
            </div>

            <div className="recent-groups-list">
              {groupList.length > 0 ? (
                groupList.map((group) => (
                  <button
                    key={group.id}
                    className="recent-card"
                    onClick={() => {
                      useAppStore.setState({
                        activeGroup: {
                          id:           group.id,
                          short_code:   group.short_code,
                          name:         group.name,
                          context:      group.context,
                          organizer_id: '',
                          settings: {
                            separationThresholdMeters: 100,
                            syncThresholdMeters:       20,
                            syncThresholdSeconds:      30,
                          },
                          myRole: group.myRole,
                        },
                      });
                      navigate('/ride-setup');
                    }}
                  >
                    <div className="group-avatar" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <Icon name={group.context === 'family' ? 'eye' : 'users'} size={18} />
                    </div>
                    <div className="group-info">
                      <div className="group-name">{group.name}</div>
                      <div className="group-meta">
                        <span className="meta-code">{group.short_code}</span>
                        <span className="meta-type">{group.context}</span>
                      </div>
                    </div>
                    <Icon name="chevron-right" size={16} />
                  </button>
                ))
              ) : (
                <div className="empty-history">
                  <div className="empty-icon"><Icon name="history" size={32} /></div>
                  <p>No recent activity yet. Start your first session to see it here!</p>
                </div>
              )}
            </div>
          </section>

          {/* MIDDLE: NEW CONNECTION */}
          <section className="dash-col dash-col--main">
            <div className="col-header">
              <h2 className="col-title">Start New Session</h2>
              <p className="col-sub">Link with a partner via their 4-digit PIN.</p>
            </div>

            <div className="connection-card">
              <form onSubmit={handlePairWithPin}>
                <div className="pin-input-container">
                  <label className="input-label">Partner's PIN</label>
                  <input
                    className="pin-field"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    value={partnerPin}
                    onChange={(e) => setPartnerPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="0 0 0 0"
                    autoFocus
                    required
                  />
                </div>
                {error && <p className="error-text">{error}</p>}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="btn-primary btn-xl"
                    type="submit"
                    disabled={loading || partnerPin.length < 4}
                    style={{ minWidth: '240px' }}
                  >
                    {loading ? 'Linking Devices…' : 'Link & Start Ride'}
                    <Icon name="arrow-right" size={20} />
                  </button>
                </div>
              </form>

              <div className="connection-promo">
                <div className="promo-item" onClick={() => navigate('/create')}>
                  <div className="promo-icon"><Icon name="users" size={20} /></div>
                  <div className="promo-text">
                    <strong>Group Session</strong>
                    <span>Create for 3+ people</span>
                  </div>
                  <Icon name="plus" size={16} />
                </div>
                <div className="promo-item" onClick={() => navigate('/join')}>
                  <div className="promo-icon"><Icon name="key" size={20} /></div>
                  <div className="promo-text">
                    <strong>Join Group</strong>
                    <span>Enter group access code</span>
                  </div>
                  <Icon name="chevron-right" size={16} />
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: HOW IT WORKS */}
          <aside className="dash-col dash-col--side">
            <div className="col-header">
              <h2 className="col-title">Guide</h2>
            </div>
            
            <div className="guide-stack">
              <div className="guide-item">
                <div className="guide-num">01</div>
                <div className="guide-body">
                  <strong>Share your PIN</strong>
                  <p>Give your partner the code {myPin} to let them link with you.</p>
                </div>
              </div>
              <div className="guide-item">
                <div className="guide-num">02</div>
                <div className="guide-body">
                  <strong>Authorize</strong>
                  <p>Once linked, both devices must authorize high-precision GPS.</p>
                </div>
              </div>
              <div className="guide-item">
                <div className="guide-num">03</div>
                <div className="guide-body">
                  <strong>Monitor</strong>
                  <p>Stay within your group's safety thresholds for auto-alerts.</p>
                </div>
              </div>
            </div>

            <div className="security-note">
              <Icon name="shield" size={16} />
              <span>Session data is ephemeral and encrypted via Supabase Realtime.</span>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .dashboard-screen {
          background: var(--color-bg);
          padding-bottom: 60px;
        }
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
          background: rgba(0,0,0,0.2);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .user-avatar {
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
        .user-greeting {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-text-sub);
          margin-bottom: 2px;
          display: block;
        }
        .screen-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .compact-pin {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pin-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--color-text-sub);
          letter-spacing: 0.1em;
        }
        .pin-val {
          font-family: var(--font-mono);
          font-size: 20px;
          color: var(--color-accent);
          letter-spacing: 0.1em;
        }
        .pin-copy-btn {
          color: var(--color-text-sub);
          transition: color 0.2s;
        }
        .pin-copy-btn:hover {
          color: var(--color-accent);
        }

        .dash-content {
          padding: 40px 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .dash-grid {
          display: grid;
          grid-template-columns: 320px 1fr 300px;
          gap: 40px;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .dash-grid {
            grid-template-columns: 300px 1fr;
          }
          .dash-col--side {
            display: none;
          }
        }
        @media (max-width: 800px) {
          .dash-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .dash-header {
            padding: 20px;
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          .header-actions {
            width: 100%;
            justify-content: center;
          }
          .dash-content {
            padding: 20px;
          }
          .pin-field {
            font-size: 56px;
            letter-spacing: 0.2em;
          }
          .connection-card {
            padding: 24px;
          }
          .dash-col--recent {
            order: 2;
          }
          .dash-col--main {
            order: 1;
          }
        }
        @media (max-width: 500px) {
          .pin-field {
            font-size: 42px;
            letter-spacing: 0.15em;
          }
          .connection-promo {
            grid-template-columns: 1fr;
          }
          .dash-header {
            padding: 16px;
          }
          .dash-content {
            padding: 16px;
          }
        }

        .col-header {
          margin-bottom: 24px;
        }
        .col-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .col-sub {
          font-size: 14px;
          color: var(--color-text-sub);
        }

        .recent-groups-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .recent-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          text-align: left;
          transition: all 0.2s;
        }
        .recent-card:hover {
          border-color: var(--color-accent);
          background: var(--color-surface-2);
        }

        .group-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
        }
        .group-name {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 2px;
        }
        .group-meta {
          font-size: 11px;
          color: var(--color-text-sub);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          gap: 8px;
        }

        .connection-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 24px 16px;
          box-shadow: var(--shadow-xl);
        }
        .pin-input-container {
          text-align: center;
          margin-bottom: 32px;
        }
        .pin-field {
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
        .pin-field:focus {
          border-color: var(--color-accent);
          outline: none;
        }
        .pin-field::placeholder {
          color: rgba(255,255,255,0.05);
        }

        .connection-promo {
          margin-top: 32px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .promo-item {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .promo-item:hover {
          background: var(--color-surface-2);
          border-color: rgba(255,255,255,0.2);
        }
        .promo-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(6, 214, 160, 0.1);
          color: var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .promo-text strong {
          display: block;
          font-size: 14px;
        }
        .promo-text span {
          font-size: 11px;
          color: var(--color-text-sub);
        }

        .guide-stack {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .guide-item {
          display: flex;
          gap: 16px;
        }
        .guide-num {
          font-family: var(--font-mono);
          font-size: 24px;
          font-weight: 800;
          color: rgba(255,255,255,0.05);
          line-height: 1;
        }
        .guide-body strong {
          display: block;
          margin-bottom: 4px;
          font-size: 15px;
        }
        .guide-body p {
          font-size: 13px;
          color: var(--color-text-sub);
          line-height: 1.5;
        }
        .security-note {
          margin-top: 40px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--color-muted);
          line-height: 1.4;
        }
        .empty-history {
          text-align: center;
          padding: 40px 20px;
          background: rgba(255,255,255,0.01);
          border: 1px dashed var(--color-border);
          border-radius: 20px;
          color: var(--color-text-sub);
        }
        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.3;
        }
        .empty-history p {
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
