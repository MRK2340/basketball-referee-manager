import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import NotificationPanel from '@/components/NotificationPanel';

const TopBar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { notifications } = useData();
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
        className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl"
      >
        <div className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              data-testid="topbar-menu-button"
              onClick={onMenuClick}
              className="lg:hidden text-slate-700 hover:bg-slate-100 transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                <img alt="Basketball Reff logo" className="h-7 w-7" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
              </div>
              <div className="hidden sm:block">
                <p className="app-kicker">Operations</p>
                <span className="block text-lg font-bold tracking-tight text-slate-950">
                Basketball Reff
                </span>
              </div>
            </div>
          </div>

          {/* Center Section - Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                data-testid="topbar-search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search games or teams, press Enter..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              data-testid="topbar-notifications-button"
              onClick={() => setNotifOpen(true)}
              className="relative rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all duration-200"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 p-0 text-xs text-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Avatar */}
            <div className="flex items-center space-x-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <Avatar className="h-9 w-9 ring-2 ring-slate-200">
                <img src={user?.avatar_url} alt={user?.name} className="rounded-full" />
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-950">{user?.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{user?.role}</p>
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
