import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  Trophy, 
  MessageSquare, 
  User 
} from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();

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
      className="fixed bottom-0 left-0 right-0 bg-[#0080C8] backdrop-blur-md border-t border-[#4DB8E8] mobile-safe"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                isActive ? 'text-[#FF8C00]' : 'text-white'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${isActive ? 'bg-[#FF8C00]/20' : ''}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FF8C00] rounded-full"
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