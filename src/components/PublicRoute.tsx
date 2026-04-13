import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner clockwise={false} />;
  }

  if (user) {
    const from = location.state?.from?.pathname || (user.role === 'manager' ? '/manager' : '/dashboard');
    return <Navigate to={from} replace />;
  }

  return children;
};

export default PublicRoute;
