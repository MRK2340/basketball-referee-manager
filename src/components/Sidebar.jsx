import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  User,
  Calendar,
  Trophy,
  DollarSign,
  MessageSquare,
  CalendarDays,
  Settings,
  LogOut,
  X,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinkClass = ({ isActive }) =>
  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
    isActive ? 'bg-[#FF8C00] text-white shadow-lg' : 'text-white hover:bg-[#4DB8E8] hover:text-white'
  }`;

const NavItem = ({ item, onClose }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={navLinkClass}
      data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  );
};

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/schedule', icon: Calendar, label: 'Schedule' },
    { path: '/games', icon: Trophy, label: 'Games' },
    { path: '/payments', icon: DollarSign, label: 'Payments' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const managerNavigation = [
    { path: '/manager', icon: ClipboardList, label: 'Management' }
  ];

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="h-full bg-[#0080C8] border-r border-[#4DB8E8] flex flex-col"
    >
      <div className="p-6 border-b border-[#4DB8E8]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img alt="Basketball Reff logo" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 5px rgba(255,140,0,0.7))' }} src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Basketball Reff</h2>
              <p className="text-white/70 text-sm">AAU Youth League</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              data-testid="sidebar-close-button"
              onClick={onClose}
              className="text-white hover:bg-[#4DB8E8]/30 lg:hidden transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 border-b border-[#4DB8E8]">
        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar_url}
            alt={user?.name}
            className="w-12 h-12 rounded-full ring-2 ring-[#FF8C00]"
          />
          <div>
            <h3 className="text-white font-semibold">{user?.name}</h3>
            <p className="text-white/70 text-sm capitalize">{user?.role}</p>
            {user?.rating && (
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-[#FF8C00]">⭐</span>
                <span className="text-white text-xs">{user.rating}/5.0</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {navigationItems.map((item) => (
          <NavItem key={item.path} item={item} onClose={onClose} />
        ))}

        {user?.role === 'manager' && (
          <>
            <div className="px-4 pt-4 pb-2 text-xs font-semibold text-white/70 uppercase">
              Manager Tools
            </div>
            {managerNavigation.map((item) => (
              <NavItem key={item.path} item={item} onClose={onClose} />
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-[#4DB8E8] mt-auto">
        <Button
          onClick={handleLogout}
          variant="ghost"
          data-testid="sidebar-sign-out-button"
          className="w-full justify-start text-white hover:text-white hover:bg-[#4DB8E8]/30 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
};

export default Sidebar;