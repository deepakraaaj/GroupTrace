import { AuthForm } from '../components/auth/AuthForm';

export function AuthScreen() {
  return (
    <div className="screen screen--center auth-screen-bg">
      <div className="auth-overlay" />
      <AuthForm />
      
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
      `}</style>
    </div>
  );
}
