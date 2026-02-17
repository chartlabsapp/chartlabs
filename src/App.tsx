// ============================================
// BacktestPro — App Router
// ============================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import GalleryPage from './pages/GalleryPage';
import WorkspacePage from './pages/WorkspacePage';
import TimerPage from './pages/TimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
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
