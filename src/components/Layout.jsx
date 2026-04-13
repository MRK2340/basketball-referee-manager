import React, { useState } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import BottomNavigation from '@/components/BottomNavigation';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If no user, render children directly (should be handled by Route guards generally, 
  // but this is a safety fallback for Layout usage)
  if (!user) {
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col app-page-shell">
      {/* Top Bar */}
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-80 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Always visible on large screens */}
      <div className="hidden lg:block fixed left-0 top-20 h-[calc(100vh-5rem)] w-72 z-30 px-4 pb-4">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-24 lg:pb-8 lg:pl-72 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Layout;