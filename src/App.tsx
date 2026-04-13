import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import RouteTracker from '@/components/RouteTracker';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

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
            <div className="min-h-screen">
              <RouteTracker />
              <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/about" element={<PublicRoute><AboutPage /></PublicRoute>} />
                <Route path="/contact" element={<PublicRoute><ContactPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                
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
          </DataProvider>
        </AuthProvider>
      </Router>
      </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;