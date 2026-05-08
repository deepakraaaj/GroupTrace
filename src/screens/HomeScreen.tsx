import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { getUserName } from '../utils/deviceId';

export function HomeScreen() {
  const navigate = useNavigate();
  const userName = getUserName();

  return (
    <div className="screen screen--center home-screen">
      <header className="home-header">
        <div className="home-icon">
          <Icon name="compass" size={64} />
        </div>
        <h1>GroupTrace</h1>
        <p className="home-sub">Ready to ride?</p>
        <p className="home-name">👋 {userName}</p>
      </header>

      <div className="home-actions">
        <button
          className="action-card action-card--primary"
          onClick={() => navigate('/start-session')}
        >
          <div className="action-icon">
            <Icon name="plus" size={40} />
          </div>
          <div className="action-text">
            <strong>Start a Ride</strong>
            <span>Create a session and invite friends</span>
          </div>
          <Icon name="arrow-right" size={20} />
        </button>

        <button
          className="action-card action-card--secondary"
          onClick={() => navigate('/join-session')}
        >
          <div className="action-icon">
            <Icon name="key" size={40} />
          </div>
          <div className="action-text">
            <strong>Join a Ride</strong>
            <span>Enter a session code</span>
          </div>
          <Icon name="arrow-right" size={20} />
        </button>
      </div>

      <style>{`
        .home-screen {
          background: var(--color-bg);
        }
        .home-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .home-icon {
          color: var(--color-accent);
          margin-bottom: 24px;
        }
        .home-header h1 {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .home-sub {
          font-size: 18px;
          color: var(--color-text-sub);
          margin-bottom: 16px;
        }
        .home-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .home-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 400px;
          width: 100%;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .action-card:hover {
          border-color: var(--color-accent);
          background: var(--color-surface-2);
          transform: translateY(-2px);
        }

        .action-card--primary {
          border-color: var(--color-accent);
          background: rgba(6, 214, 160, 0.08);
        }
        .action-card--primary:hover {
          background: rgba(6, 214, 160, 0.12);
        }

        .action-icon {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          color: var(--color-accent);
        }

        .action-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .action-text strong {
          font-size: 16px;
          display: block;
        }
        .action-text span {
          font-size: 13px;
          color: var(--color-text-sub);
        }

        .action-card svg:last-child {
          flex-shrink: 0;
          opacity: 0.4;
          transition: opacity 0.2s;
        }
        .action-card:hover svg:last-child {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
