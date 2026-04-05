/**
 * Single source of truth for demo account base profiles.
 * Imported by both AuthContext.jsx (auth layer) and demoDataService.js (data layer)
 * so a schema change only needs to be made in one place.
 *
 * NOTE: passwords are NOT stored here — they are applied by AuthContext at runtime
 * using the current obfuscation scheme.
 */

export const DEMO_MANAGER_ID = 'demo-manager';
export const DEMO_REFEREE_ID = 'demo-referee';

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
