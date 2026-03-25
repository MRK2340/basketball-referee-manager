import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
     return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -180, -360],
          }}
          transition={{ 
            duration: 2,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
          }}
          className="w-16 h-16 rounded-full border-4 border-[#0080C8] border-t-transparent flex items-center justify-center"
        >
          <div className="w-8 h-8 bg-[#FF8C00] rounded-full" />
        </motion.div>
      </div>
    );
  }

  if (user) {
    // If user is already logged in, redirect them to their dashboard
    // Check if there is a 'from' location state to redirect back to
    const from = location.state?.from?.pathname || (user.role === 'manager' ? '/manager' : '/dashboard');
    return <Navigate to={from} replace />;
  }

  return children;
};

export default PublicRoute;