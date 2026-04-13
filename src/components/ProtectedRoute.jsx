import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner clockwise={true} />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const ROLE_HOME = { manager: '/manager', referee: '/dashboard' };
    return <Navigate to={ROLE_HOME[user.role] ?? '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
