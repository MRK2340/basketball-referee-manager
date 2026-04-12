/**
 * Single source of truth for demo account credentials and base profiles.
 * Imported by AuthContext.jsx (auth layer), Login.jsx (demo login), and demoDataService.js (data layer).
 */

export const DEMO_MANAGER_ID = 'demo-manager';
export const DEMO_REFEREE_ID = 'demo-referee';

// Demo passwords are stored in .env (VITE_DEMO_MANAGER_PASSWORD / VITE_DEMO_REFEREE_PASSWORD)
// so they stay out of committed source code while remaining configurable.
export const DEMO_MANAGER_PASSWORD = import.meta.env.VITE_DEMO_MANAGER_PASSWORD;
export const DEMO_REFEREE_PASSWORD = import.meta.env.VITE_DEMO_REFEREE_PASSWORD;

export const DEMO_MANAGER_BASE = {
  id: DEMO_MANAGER_ID,
  email: 'manager@demo.com',
  name: 'Demo Manager',
  role: 'manager',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
  rating: 5.0,
  experience: '10 years',
  phone: '+1 555 0199',
};

export const DEMO_REFEREE_BASE = {
  id: DEMO_REFEREE_ID,
  email: 'referee@demo.com',
  name: 'Demo Referee',
  role: 'referee',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=referee',
  rating: 4.8,
  experience: '3 years',
  phone: '+1 555 0123',
  certifications: ['Certified Official Level 1', 'NFHS Certified'],
  games_officiated: 42,
};
