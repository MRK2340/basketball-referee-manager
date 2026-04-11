/**
 * RouteTracker.jsx
 * Fires a page_view Analytics event on every React Router navigation.
 * Must be rendered inside <Router> so useLocation() works.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Analytics } from '@/lib/analytics';

const PAGE_TITLES = {
  '/':             'Landing',
  '/login':        'Login',
  '/register':     'Register',
  '/dashboard':    'Dashboard',
  '/profile':      'Profile',
  '/schedule':     'Schedule',
  '/games':        'Games',
  '/payments':     'Payments',
  '/messages':     'Messages',
  '/calendar':     'Calendar',
  '/settings':     'Settings',
  '/analytics':    'Performance Analytics',
  '/manager':      'Manager Hub',
  '/find-managers':'Find Managers',
  '/game-report':  'Game Report',
  '/about':        'About',
  '/contact':      'Contact',
};

const RouteTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = PAGE_TITLES[pathname] || pathname.replace('/', '');
    Analytics.pageView(pathname, title);
  }, [pathname]);

  return null;
};

export default RouteTracker;
