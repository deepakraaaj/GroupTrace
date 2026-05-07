import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { AuthScreen } from './screens/AuthScreen';
import { GroupSelectionScreen } from './screens/GroupSelectionScreen';
import { JoinScreen } from './screens/JoinScreen';
import { CreateScreen } from './screens/CreateScreen';
import { RideSetupScreen } from './screens/RideSetupScreen';
import { ActiveRideScreen } from './screens/ActiveRideScreen';
import { PostRideScreen } from './screens/PostRideScreen';
import { PageTransition } from './components/ui/PageTransition';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user          = useAppStore((s) => s.user);
  const isAuthLoading = useAppStore((s) => s.isAuthLoading);

  if (isAuthLoading) {
    return (
      <div className="screen screen--center">
        <div className="loading-spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function App() {
  const setUser        = useAppStore((s) => s.setUser);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);
  const location       = useLocation();

  useEffect(() => {
    const pin   = localStorage.getItem('grouptrace_pin');
    const name  = localStorage.getItem('grouptrace_name');
    const color = localStorage.getItem('grouptrace_color');

    if (pin && name && color) {
      setUser({
        id: `pin-${pin}`,
        display_name: name,
        avatar_color: color,
        phone_hash: null,
        device_id: null,
      });
    }

    setAuthLoading(false);
  }, []);

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/auth" element={<PageTransition><AuthScreen /></PageTransition>} />
      
      <Route path="/" element={
        <RequireAuth>
          <PageTransition><GroupSelectionScreen /></PageTransition>
        </RequireAuth>
      } />
      
      <Route path="/join" element={
        <RequireAuth>
          <PageTransition><JoinScreen /></PageTransition>
        </RequireAuth>
      } />
      
      <Route path="/create" element={
        <RequireAuth>
          <PageTransition><CreateScreen /></PageTransition>
        </RequireAuth>
      } />
      
      <Route path="/ride-setup" element={
        <RequireAuth>
          <PageTransition><RideSetupScreen /></PageTransition>
        </RequireAuth>
      } />
      
      <Route path="/active-ride" element={
        <RequireAuth>
          <PageTransition><ActiveRideScreen /></PageTransition>
        </RequireAuth>
      } />
      
      <Route path="/post-ride" element={
        <RequireAuth>
          <PageTransition><PostRideScreen /></PageTransition>
        </RequireAuth>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
