import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';

// Pages
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Schedule from '@/pages/Schedule';
import Games from '@/pages/Games';
import Payments from '@/pages/Payments';
import Messages from '@/pages/Messages';
import Calendar from '@/pages/Calendar';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Manager from '@/pages/Manager';
import GameReport from '@/pages/GameReport';
import PerformanceAnalytics from '@/pages/PerformanceAnalytics';
import LandingPage from '@/pages/LandingPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Helmet>
          <title>iWhistle - Leadership Under Pressure</title>
          <meta name="description" content="iWhistle — Professional AAU youth basketball officiating platform. Schedule games, track performance, manage payments, and elevate your officiating." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Helmet>
        
        <AuthProvider>
          <DataProvider>
            <div className="min-h-screen bg-slate-900 text-slate-100">
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

                {/* 404 Handler */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;