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
  `flex items-center space-x-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
    isActive
      ? 'border border-slate-200 bg-white text-slate-950 shadow-sm'
      : 'text-slate-600 hover:bg-white hover:text-slate-950'
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
      className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
              <img alt="Basketball Reff logo" className="h-7 w-7" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
            </div>
            <div>
              <p className="app-kicker">League desk</p>
              <h2 className="text-lg font-bold text-slate-950">Basketball Reff</h2>
              <p className="text-sm text-slate-500">AAU Youth League</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              data-testid="sidebar-close-button"
              onClick={onClose}
              className="text-slate-700 hover:bg-slate-100 lg:hidden transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center space-x-3 rounded-2xl bg-slate-50 p-3">
          <img
            src={user?.avatar_url}
            alt={user?.name}
            className="h-12 w-12 rounded-full ring-2 ring-white shadow-sm"
          />
          <div>
            <h3 className="font-semibold text-slate-950">{user?.name}</h3>
            <p className="text-sm capitalize text-slate-500">{user?.role}</p>
            {user?.rating && (
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-blue-600">★</span>
                <span className="text-xs text-slate-700">{user.rating}/5.0</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-hide">
        {navigationItems.map((item) => (
          <NavItem key={item.path} item={item} onClose={onClose} />
        ))}

        {user?.role === 'manager' && (
          <>
            <div className="px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Manager Tools
            </div>
            {managerNavigation.map((item) => (
              <NavItem key={item.path} item={item} onClose={onClose} />
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-4">
        <Button
          onClick={handleLogout}
          variant="ghost"
          data-testid="sidebar-sign-out-button"
          className="w-full justify-start rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
};

export default Sidebar;