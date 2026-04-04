import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import NotificationPanel from '@/components/NotificationPanel';

const TopBar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { notifications } = useData();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/schedule?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? 'border-b border-white/10 bg-[rgba(0,28,60,0.95)]'
            : 'border-b border-slate-200/80 bg-white/88'
        }`}
      >
        <div className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              data-testid="topbar-menu-button"
              onClick={onMenuClick}
              className={`lg:hidden transition-all duration-200 ${isDark ? 'text-blue-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-colors duration-300 ${isDark ? 'border border-white/10 bg-white/10' : 'border border-slate-200 bg-slate-50'}`}>
                <img alt="iWhistle logo" className="h-7 w-7" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
              </div>
              <div className="hidden sm:block">
                <p className="app-kicker" style={{color: isDark ? 'rgba(184,212,232,0.7)' : undefined}}>League Desk</p>
                <span className="block text-lg font-bold tracking-tight" style={{color: isDark ? '#4DB8E8' : '#003D7A'}}>
                  iWhistle
                </span>
              </div>
            </div>
          </div>

          {/* Center Section - Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? 'text-blue-300/60' : 'text-slate-400'}`} />
              <input
                type="text"
                data-testid="topbar-search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search games or teams, press Enter..."
                className={`w-full rounded-xl pl-10 pr-4 py-3 placeholder text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'border border-white/10 bg-white/5 text-blue-100 placeholder-blue-300/40 focus:ring-blue-500/20 focus:border-blue-400/30'
                    : 'border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-300 focus:ring-blue-500/20'
                }`}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              data-testid="theme-toggle-button"
              onClick={toggleTheme}
              className={`rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'border-white/10 text-amber-300 hover:bg-white/10'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <motion.div
                key={isDark ? 'sun' : 'moon'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              data-testid="topbar-notifications-button"
              onClick={() => setNotifOpen(true)}
              className={`relative rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'border-white/10 text-blue-200 hover:bg-white/10'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white p-0 text-xs text-white" style={{backgroundColor: '#0080C8', borderColor: isDark ? '#002849' : 'white'}}>
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Avatar */}
            <div className={`flex items-center space-x-3 rounded-2xl px-2 py-1.5 shadow-sm transition-colors duration-300 ${
              isDark ? 'border border-white/10 bg-white/5' : 'border border-slate-200 bg-white'
            }`}>
              <Avatar className="h-9 w-9 ring-2 ring-slate-200">
                <img src={user?.avatar_url} alt={user?.name} className="rounded-full" />
              </Avatar>
              <div className="hidden sm:block">
                <p className={`text-sm font-semibold ${isDark ? 'text-blue-100' : 'text-slate-950'}`}>{user?.name}</p>
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-blue-300/70' : 'text-slate-500'}`}>{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </>
  );
};

export default TopBar;
