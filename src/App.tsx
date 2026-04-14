import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import RouteTracker from '@/components/RouteTracker';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';

// Lazy-loaded pages — improves initial bundle size
const Dashboard          = lazy(() => import('@/pages/Dashboard'));
const Profile            = lazy(() => import('@/pages/Profile'));
const Schedule           = lazy(() => import('@/pages/Schedule'));
const Games              = lazy(() => import('@/pages/Games'));
const Payments           = lazy(() => import('@/pages/Payments'));
const Messages           = lazy(() => import('@/pages/Messages'));
const Calendar           = lazy(() => import('@/pages/Calendar'));
const Settings           = lazy(() => import('@/pages/Settings'));
const Login              = lazy(() => import('@/pages/Login'));
const Register           = lazy(() => import('@/pages/Register'));
const Manager            = lazy(() => import('@/pages/Manager'));
const GameReport         = lazy(() => import('@/pages/GameReport'));
const PerformanceAnalytics = lazy(() => import('@/pages/PerformanceAnalytics'));
const LandingPage        = lazy(() => import('@/pages/LandingPage'));
const AboutPage          = lazy(() => import('@/pages/AboutPage'));
const ContactPage        = lazy(() => import('@/pages/ContactPage'));
const NotFound           = lazy(() => import('@/pages/NotFound'));
const FindManagersPage   = lazy(() => import('@/pages/FindManagers'));
const RefereePublicProfile = lazy(() => import('@/pages/RefereePublicProfile'));
const HelpCenter         = lazy(() => import('@/pages/HelpCenter'));

/** Inner shell inside AuthProvider — sync monitoring + remote config feature flags */
const SyncMonitor = () => {
  const { user } = useAuth();
  const syncState = useSyncStatus(user);
  return <SyncStatusIndicator syncState={syncState} />;
};

/** Announcement banner from Remote Config (shown above all content) */
const AnnouncementBanner = () => {
  const { announcementBanner, announcementBannerColor } = useRemoteConfig();
  if (!announcementBanner) return null;
  return (
    <div
      className="text-white text-sm font-medium py-2 px-4 text-center"
      style={{ backgroundColor: announcementBannerColor || '#0080C8' }}
      data-testid="announcement-banner"
    >
      {announcementBanner}
    </div>
  );
};

/** Maintenance mode gate — blocks the entire app when enabled via Remote Config */
const MaintenanceGate = ({ children }: { children: React.ReactNode }) => {
  const { maintenanceMode, maintenanceMessage, loading } = useRemoteConfig();
  if (loading) return null; // Don't flash maintenance screen while loading config
  if (!maintenanceMode) return <>{children}</>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8" data-testid="maintenance-screen">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">🏀</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Under Maintenance</h1>
        <p className="text-slate-600">{maintenanceMessage}</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
      <ThemeProvider>
      <Router>
        <Helmet>
          <title>iWhistle - Leadership Under Pressure</title>
          <meta name="description" content="iWhistle — Professional AAU youth basketball officiating platform. Schedule games, track performance, manage payments, and elevate your officiating." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Helmet>
        
        <AuthProvider>
          <DataProvider>
            <MaintenanceGate>
            <div className="min-h-screen">
              <AnnouncementBanner />
              <OfflineIndicator />
              <SyncMonitor />
              <RouteTracker />
              <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/about" element={<PublicRoute><AboutPage /></PublicRoute>} />
                <Route path="/contact" element={<PublicRoute><ContactPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/referee/:id" element={<RefereePublicProfile />} />
                
                {/* Protected Routes - Referees & Managers */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Layout><Profile /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/schedule" element={
                  <ProtectedRoute>
                    <Layout><Schedule /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/games" element={
                  <ProtectedRoute>
                    <Layout><Games /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/payments" element={
                  <ProtectedRoute>
                    <Layout><Payments /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Layout><Messages /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <Layout><Calendar /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout><Settings /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/help" element={
                  <ProtectedRoute>
                    <Layout><HelpCenter /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Layout><PerformanceAnalytics /></Layout>
                  </ProtectedRoute>
                } />
                
                {/* Protected Routes - Role Specific */}
                <Route path="/game-report" element={
                  <ProtectedRoute roles={['referee']}>
                    <Layout><GameReport /></Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/manager" element={
                  <ProtectedRoute roles={['manager']}>
                    <Layout><Manager /></Layout>
                  </ProtectedRoute>
                } />

                <Route path="/find-managers" element={
                  <ProtectedRoute roles={['referee']}>
                    <Layout><FindManagersPage /></Layout>
                  </ProtectedRoute>
                } />

                {/* 404 Handler */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </div>
            <Toaster />
            </MaintenanceGate>
          </DataProvider>
        </AuthProvider>
      </Router>
      </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;