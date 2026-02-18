// ============================================
// ChartLabs — App Router (Auth-Gated)
// ============================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import GalleryPage from './pages/GalleryPage';
import WorkspacePage from './pages/WorkspacePage';
import TimerPage from './pages/TimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';

export default function App() {
  const { user, loading } = useAuth();

  // Show loading screen while auth state initializes
  if (loading) {
    return (
      <div className="landing-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Unauthenticated → landing page
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Authenticated → full app
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/workspace/:chartId" element={<WorkspacePage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
