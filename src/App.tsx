import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { StartSessionScreen } from './screens/StartSessionScreen';
import { JoinSessionScreen } from './screens/JoinSessionScreen';
import { ActiveRideScreen } from './screens/ActiveRideScreen';
import { PostRideScreen } from './screens/PostRideScreen';
import { PageTransition } from './components/ui/PageTransition';
import { getUserName, getOrCreateDeviceId } from './utils/deviceId';

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const userName = getUserName();

  if (!userName) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function App() {
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize device ID and check if onboarded
    getOrCreateDeviceId();
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="screen screen--center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/onboarding" element={<PageTransition><OnboardingScreen /></PageTransition>} />

      <Route path="/" element={
        <RequireOnboarding>
          <PageTransition><HomeScreen /></PageTransition>
        </RequireOnboarding>
      } />

      <Route path="/start-session" element={
        <RequireOnboarding>
          <PageTransition><StartSessionScreen /></PageTransition>
        </RequireOnboarding>
      } />

      <Route path="/join-session" element={
        <RequireOnboarding>
          <PageTransition><JoinSessionScreen /></PageTransition>
        </RequireOnboarding>
      } />

      <Route path="/ride/:sessionId" element={
        <RequireOnboarding>
          <PageTransition><ActiveRideScreen /></PageTransition>
        </RequireOnboarding>
      } />

      <Route path="/post-ride/:sessionId" element={
        <RequireOnboarding>
          <PageTransition><PostRideScreen /></PageTransition>
        </RequireOnboarding>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
