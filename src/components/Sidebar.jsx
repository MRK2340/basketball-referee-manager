import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home, User, Calendar, Trophy, DollarSign, MessageSquare,
  CalendarDays, Settings, LogOut, X, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const navLinkClass = ({ isActive }) =>
    `flex items-center space-x-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
      isActive
        ? isDark
          ? 'border border-white/10 bg-white/10 text-amber-300 shadow-sm font-semibold'
          : 'border bg-[#E6F2F8] text-[#0080C8] shadow-sm font-semibold'
        : isDark
          ? 'text-blue-200 hover:bg-white/10 hover:text-white'
          : 'text-slate-600 hover:bg-[#E6F2F8] hover:text-[#0080C8]'
    }`;

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
      data-sidebar
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={`flex h-full flex-col rounded-[1.5rem] shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-300 ${
        isDark
          ? 'border border-white/10 bg-[rgba(0,28,60,0.95)]'
          : 'border border-slate-200 bg-white/92'
      }`}
    >
      {/* Header */}
      <div className={`border-b p-6 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${isDark ? 'border border-white/10 bg-white/10' : 'border border-slate-200 bg-slate-50'}`}>
              <img alt="iWhistle logo" className="h-7 w-7" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
            </div>
            <div>
              <p className="app-kicker" style={{color: isDark ? 'rgba(184,212,232,0.6)' : undefined}}>League Desk</p>
              <h2 className="text-lg font-bold" style={{color: isDark ? '#4DB8E8' : '#003D7A'}}>iWhistle</h2>
              <p className={`text-sm ${isDark ? 'text-blue-300/60' : 'text-slate-500'}`}>AAU Youth League</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              data-testid="sidebar-close-button"
              onClick={onClose}
              className={`lg:hidden transition-all duration-200 ${isDark ? 'text-blue-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* User card */}
      <div className={`border-b p-6 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className={`flex items-center space-x-3 rounded-2xl p-3 ${isDark ? 'bg-white/8' : 'bg-slate-50'}`}>
          <img
            src={user?.avatar_url}
            alt={user?.name}
            className="h-12 w-12 rounded-full ring-2 ring-white shadow-sm"
          />
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-blue-100' : 'text-slate-950'}`}>{user?.name}</h3>
            <p className={`text-sm capitalize ${isDark ? 'text-blue-300/70' : 'text-slate-500'}`}>{user?.role}</p>
            {user?.rating && (
              <div className="flex items-center space-x-1 mt-1">
                <span style={{color: '#0080C8'}}>★</span>
                <span className={`text-xs ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>{user.rating}/5.0</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-hide">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={navLinkClass}
              data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}

        {user?.role === 'manager' && (
          <>
            <div className={`px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-blue-300/50' : 'text-slate-400'}`}>
              Manager Tools
            </div>
            {managerNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={navLinkClass}
                  data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={`mt-auto border-t p-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <Button
          onClick={handleLogout}
          variant="ghost"
          data-testid="sidebar-sign-out-button"
          className={`w-full justify-start rounded-xl transition-all duration-200 ${
            isDark
              ? 'text-blue-200 hover:bg-white/10 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
};

export default Sidebar;