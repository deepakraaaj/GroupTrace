import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { setUserName, getOrCreateDeviceId } from '../utils/deviceId';

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    getOrCreateDeviceId();
    setUserName(name.trim());
    navigate('/', { replace: true });
  };

  return (
    <div className="screen screen--center auth-screen-bg">
      <div className="auth-overlay" />

      <div className="auth-form" style={{ maxWidth: '400px' }}>
        <header className="auth-logo">
          <div className="auth-logo-icon">
            <Icon name="compass" size={48} className="icon-accent" />
          </div>
          <h1>GroupTrace</h1>
          <p>Real-time group location tracking for the road ahead.</p>
        </header>

        <div className="auth-form-body">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="user-name">
                Your Name
              </label>
              <input
                id="user-name"
                className="text-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ram, Priya"
                autoFocus
                maxLength={30}
                required
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              className="btn-primary btn-xl"
              type="submit"
              style={{ width: '100%' }}
            >
              Get Started
              <Icon name="arrow-right" size={20} />
            </button>

            <div className="auth-footer-note" style={{
              marginTop: '24px',
              textAlign: 'center',
              opacity: 0.6,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Icon name="alert-circle" size={14} />
              <span>Your name is visible to everyone in your rides.</span>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .auth-screen-bg {
          background:
            radial-gradient(circle at 0% 0%, rgba(6, 214, 160, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.15) 0%, transparent 40%),
            var(--color-bg);
          position: relative;
        }
        .auth-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }
        .auth-form {
          position: relative;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
