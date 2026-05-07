import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { Icon } from '../ui/Icon';
import { supabase } from '../../services/supabaseClient';

const DEFAULT_TEST_PIN = '1234';

export function AuthForm() {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'name' | 'pin'>('name');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name to continue');
      return;
    }
    setStep('pin');
    setError('');
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        throw new Error('PIN must be exactly 4 digits');
      }

      // 1. Check if we already have a UUID for this PIN locally, otherwise generate one
      let userId = localStorage.getItem('grouptrace_user_id');
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('grouptrace_user_id', userId);
      }
      
      const userColor = randomColor();

      // 2. Register/Update user in public.users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          display_name: name.trim(),
          avatar_color: userColor,
        });

      if (userError) throw userError;

      // 3. Create their "Personal Group" (so others can join them via PIN)
      // This uses a RPC or a direct insert if permissions allow
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .upsert({
          short_code: pin,
          name: `${name.trim()}'s Session`,
          context: 'family',
          organizer_id: userId,
        }, { onConflict: 'short_code' })
        .select()
        .single();

      // If they are the organizer, they also need to be a member
      if (groupData) {
        await supabase.from('group_members').upsert({
          group_id: groupData.id,
          user_id: userId,
          role: 'organizer',
          is_active: true
        }, { onConflict: 'group_id,user_id' });
      }

      setUser({
        id: userId,
        display_name: name.trim(),
        avatar_color: userColor,
        phone_hash: null,
        device_id: null,
      });

      localStorage.setItem('grouptrace_pin', pin);
      localStorage.setItem('grouptrace_name', name.trim());
      localStorage.setItem('grouptrace_color', userColor);

      navigate('/', { replace: true });
    } catch (e: unknown) {
      console.error('Auth Error:', e);
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <header className="auth-logo">
        <div className="auth-logo-icon">
          <Icon name="compass" size={48} className="icon-accent" />
        </div>
        <h1>GroupTrace</h1>
        <p>Precision group tracking for the road ahead.</p>
      </header>

      <div className="auth-form-body">
        {step === 'name' ? (
          <form onSubmit={handleNameSubmit} className="fade-in">
            <div className="input-group">
              <label className="input-label" htmlFor="user-name">Your Display Name</label>
              <input
                id="user-name"
                className="text-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maverick"
                autoFocus
                maxLength={30}
                required
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary btn-xl" type="submit" disabled={loading}>
              Continue
              <Icon name="arrow-left" size={20} style={{ transform: 'rotate(180deg)', marginLeft: '8px' }} />
            </button>
            <div className="auth-footer-note" style={{ marginTop: '24px', textAlign: 'center', opacity: 0.6, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Icon name="alert-circle" size={14} />
              <span>Visible to your group members during rides.</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="fade-in">
            <div className="input-group">
              <label className="input-label" htmlFor="user-pin">Create your 4-Digit PIN</label>
              <input
                id="user-pin"
                className="pin-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                autoFocus
                required
              />
            </div>
            <p className="auth-sub" style={{ textAlign: 'center', marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-sub)' }}>
              This PIN identifies you. Share it only with people you want to share your location with.
            </p>
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary btn-xl" type="submit" disabled={loading || pin.length < 4}>
              {loading ? 'Securing Session…' : 'Initialize Account'}
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={() => { setStep('name'); setPin(''); setError(''); }}
              style={{ marginTop: '12px', width: '100%' }}
            >
              Back to name
            </button>
          </form>
        )}
      </div>

      <div className="auth-test-hint" style={{ marginTop: '32px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-sub)', textAlign: 'center' }}>
        <span>Dev Mode: use a unique 4-digit PIN per device, for example <strong>{DEFAULT_TEST_PIN}</strong> and <strong>5678</strong>.</span>
      </div>
    </div>
  );
}

function randomColor(): string {
  const COLORS = [
    '#06d6a0', '#7c3aed', '#3b82f6', '#f59e0b',
    '#ef4444', '#10b981', '#6366f1', '#ec4899',
    '#f97316', '#06b6d4',
  ];
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}
