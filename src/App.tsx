import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { HomeScreen } from './screens/HomeScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { RideSetupScreen } from './screens/RideSetupScreen';
import { ActiveRideScreen } from './screens/ActiveRideScreen';
import { PostRideScreen } from './screens/PostRideScreen';
import { PageTransition } from './components/ui/PageTransition';

export function App() {
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);
  const location = useLocation();

  useEffect(() => {
    // Auth is handled within HomeScreen now (with inline name setup)
    setAuthLoading(false);
  }, []);

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={
        <PageTransition><HomeScreen /></PageTransition>
      } />

      <Route path="/join" element={
        <PageTransition><JoinRoomScreen /></PageTransition>
      } />

      <Route path="/create" element={
        <PageTransition><CreateRoomScreen /></PageTransition>
      } />

      <Route path="/ride-setup" element={
        <PageTransition><RideSetupScreen /></PageTransition>
      } />

      <Route path="/active-ride" element={
        <PageTransition><ActiveRideScreen /></PageTransition>
      } />

      <Route path="/post-ride" element={
        <PageTransition><PostRideScreen /></PageTransition>
      } />
    </Routes>
  );
}
