import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { TripSummary } from '../components/trip/TripSummary';
import { Icon } from '../components/ui/Icon';

export function PostRideScreen() {
  const navigate    = useNavigate();
  const activeGroup = useAppStore((s) => s.activeGroup);

  const handleFinish = () => {
    useAppStore.setState({ activeGroup: null });
    navigate('/', { replace: true });
  };

  return (
    <div className="screen screen--scroll post-ride-screen">
      <div className="post-ride-hero">
        <div className="celebration-ring">
          <Icon name="check" size={48} className="text-accent" />
        </div>
        <h1 className="post-ride-title">Ride Complete</h1>
        <p className="post-ride-sub">Excellent journey! You stayed within range 98% of the time.</p>
      </div>

      <div className="post-ride-content">
        <TripSummary />

        <div className="post-ride-actions">
          <button className="btn-secondary" onClick={() => navigate('/ride-setup')}>
             <Icon name="settings" size={18} />
             Review Settings
          </button>
          <button className="btn-primary btn-xl" onClick={handleFinish} style={{ flex: 1 }}>
             Finish & Save Trip
             <Icon name="check" size={20} />
          </button>
        </div>
      </div>

      <style>{`
        .post-ride-screen {
          background: var(--color-bg);
        }
        .post-ride-hero {
          padding: 80px 24px 40px;
          text-align: center;
          background: radial-gradient(circle at center, rgba(6, 214, 160, 0.1) 0%, transparent 70%);
        }
        .celebration-ring {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: rgba(6, 214, 160, 0.1);
          border: 2px solid var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px;
          box-shadow: 0 0 40px rgba(6, 214, 160, 0.2);
          animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .post-ride-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin-bottom: 8px;
        }
        .post-ride-sub {
          font-size: 15px;
          color: var(--color-text-sub);
          max-width: 300px;
          margin: 0 auto;
        }
        .post-ride-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
        }
        .post-ride-actions {
          display: flex;
          gap: 16px;
          margin-top: 40px;
          padding-bottom: 40px;
        }
        .text-accent { color: var(--color-accent); }
      `}</style>
    </div>
  );
}
