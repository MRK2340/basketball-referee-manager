import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, Calendar, Trophy, MessageSquare, User } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  const { isDark } = useTheme();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/schedule', icon: Calendar, label: 'Schedule' },
    { path: '/games', icon: Trophy, label: 'Games' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl mobile-safe transition-colors duration-300 ${
        isDark ? 'border-t border-white/10 bg-[rgba(0,28,60,0.95)]' : 'border-t border-slate-200 bg-white/92'
      }`}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              data-testid={`bottom-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] relative ${
                isActive
                  ? isDark ? 'text-amber-300' : 'text-[#0080C8]'
                  : isDark ? 'text-blue-200/60' : 'text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? isDark ? 'bg-white/10' : 'bg-[#E6F2F8]'
                  : ''
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{backgroundColor: isDark ? '#FF8C00' : '#0080C8'}}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;