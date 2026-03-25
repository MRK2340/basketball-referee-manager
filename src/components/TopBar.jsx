import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const TopBar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { notifications } = useData();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/schedule?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-[#0080C8] backdrop-blur-md border-b border-[#4DB8E8]"
    >
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-white hover:bg-[#4DB8E8]/30 transition-all duration-200"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img alt="Basketball Reff logo" className="w-full h-full" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
            </div>
            <span className="hidden sm:block text-white font-bold text-lg">
              Basketball Reff
            </span>
          </div>
        </div>

        {/* Center Section - Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search games or teams, press Enter..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-[#4DB8E8] rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-[#4DB8E8]/30 transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FF8C00] text-white text-xs flex items-center justify-center p-0 border-2 border-[#0080C8]">
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 ring-2 ring-[#FF8C00]">
              <img src={user?.avatar_url} alt={user?.name} className="rounded-full" />
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-white text-sm font-medium">{user?.name}</p>
              <p className="text-white/70 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default TopBar;