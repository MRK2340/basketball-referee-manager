/**
 * seedFirestore.js
 * Seeds demo data into Firestore once both demo accounts exist.
 * Uses a `_meta/demo_seed` guard document so it only runs once.
 */
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

const toDateOnly = (offsetDays = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const toIso = (offsetDays = 0, hour = 9, minute = 0) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

const buildSeedData = (managerId, refereeId) => {
  /* ── Profiles for extra (non-demo) users ── */
  const extraProfiles = [
    {
      id: 'mgr-thomas', email: 'thomas@demo.com', name: 'Thomas Washington', role: 'manager',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thomas',
      rating: 4.9, experience: '8 years', phone: '+1 555 0211',
      certifications: ['Tournament Director', 'NFHS Level 3'],
      location: 'Washington, D.C.', league_name: 'Capitol Hoops Association',
      bio: 'Building the next generation of officials in the DMV area.',
    },
    {
      id: 'mgr-sarah', email: 'sarah@demo.com', name: 'Sarah Chen', role: 'manager',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      rating: 4.7, experience: '5 years', phone: '+1 555 0355',
      certifications: ['Tournament Director'],
      location: 'San Francisco, CA', league_name: 'Bay Area Youth Basketball',
      bio: 'West Coast AAU organization focused on elite officiating talent.',
    },
    {
      id: 'ref-olivia', email: 'olivia@demo.com', name: 'Olivia Brooks', role: 'referee',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia',
      rating: 4.9, experience: '6 years', phone: '+1 555 0177',
      certifications: ['NFHS Certified', 'AAU Elite'], games_officiated: 118,
    },
    {
      id: 'ref-jordan', email: 'jordan@demo.com', name: 'Jordan Ellis', role: 'referee',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
      rating: 4.6, experience: '4 years', phone: '+1 555 0144',
      certifications: ['Certified Official Level 2'], games_officiated: 76,
    },
  ];

  const tournaments = [
    {
      id: 'tournament-spring', name: 'Spring Showcase Classic',
      start_date: toDateOnly(-2), end_date: toDateOnly(9),
      location: 'Metro Sports Complex', number_of_courts: 4, manager_id: managerId,
    },
    {
      id: 'tournament-summer', name: 'Summer Prep Jam',
      start_date: toDateOnly(18), end_date: toDateOnly(22),
      location: 'Riverside Fieldhouse', number_of_courts: 3, manager_id: managerId,
    },
  ];

  const games = [
    {
      id: 'game-1', tournament_id: 'tournament-spring', manager_id: managerId,
      home_team: 'Metro Eagles', away_team: 'Northside Lions',
      game_date: toDateOnly(1), game_time: '18:00:00', venue: 'Court 1',
      status: 'scheduled', payment_amount: 65, division: 'U14 Boys', level: 'Varsity',
      required_certifications: ['NFHS Certified'], home_score: null, away_score: null,
    },
    {
      id: 'game-2', tournament_id: 'tournament-spring', manager_id: managerId,
      home_team: 'Central Storm', away_team: 'Westview Falcons',
      game_date: toDateOnly(2), game_time: '19:30:00', venue: 'Court 2',
      status: 'scheduled', payment_amount: 70, division: 'U16 Girls', level: 'JV',
      required_certifications: ['Certified Official Level 1'], home_score: null, away_score: null,
    },
    {
      id: 'game-3', tournament_id: 'tournament-spring', manager_id: managerId,
      home_team: 'Lake City Panthers', away_team: 'Harbor Heat',
      game_date: toDateOnly(4), game_time: '16:00:00', venue: 'Court 3',
      status: 'scheduled', payment_amount: 60, division: 'U13 Boys', level: 'Regional',
      required_certifications: ['AAU Elite'], home_score: null, away_score: null,
    },
    {
      id: 'game-4', tournament_id: 'tournament-spring', manager_id: managerId,
      home_team: 'Capital Cougars', away_team: 'Southside Rockets',
      game_date: toDateOnly(-3), game_time: '17:15:00', venue: 'Court 1',
      status: 'completed', payment_amount: 75, division: 'U15 Boys', level: 'Showcase',
      required_certifications: ['Certified Official Level 1'], home_score: 58, away_score: 54,
    },
    {
      id: 'game-5', tournament_id: 'tournament-summer', manager_id: managerId,
      home_team: 'River City Bulls', away_team: 'Eastside Thunder',
      game_date: toDateOnly(4), game_time: '16:30:00', venue: 'Court 2',
      status: 'scheduled', payment_amount: 70, division: 'U15 Boys', level: 'Varsity',
      required_certifications: ['Certified Official Level 2'], home_score: null, away_score: null,
    },
  ];

  const assignments = [
    { id: 'assignment-1', game_id: 'game-1', referee_id: refereeId, manager_id: managerId, status: 'assigned', decline_reason: null },
    { id: 'assignment-2', game_id: 'game-3', referee_id: 'ref-olivia', manager_id: managerId, status: 'accepted', decline_reason: null },
    { id: 'assignment-3', game_id: 'game-3', referee_id: 'ref-jordan', manager_id: managerId, status: 'assigned', decline_reason: null },
    { id: 'assignment-4', game_id: 'game-4', referee_id: refereeId, manager_id: managerId, status: 'accepted', decline_reason: null },
    { id: 'assignment-5', game_id: 'game-5', referee_id: 'ref-jordan', manager_id: managerId, status: 'accepted', decline_reason: null },
  ];

  const payments = [
    {
      id: 'payment-1', game_id: 'game-4', referee_id: refereeId, manager_id: managerId,
      amount: 75, status: 'paid', payment_date: toDateOnly(-1), payment_method: 'Direct Deposit',
    },
  ];

  const messages = [
    {
      id: 'message-1', sender_id: managerId, recipient_id: refereeId,
      participants: [managerId, refereeId],
      subject: 'Welcome to the showcase weekend',
      content: 'You are scheduled for Friday evening and can request any open games that fit your availability.',
      created_at: toIso(-1, 8, 30), is_read: false,
    },
    {
      id: 'message-2', sender_id: refereeId, recipient_id: managerId,
      participants: [managerId, refereeId],
      subject: 'Travel timing confirmed',
      content: 'I will arrive 30 minutes before my Friday assignment and can stay late if needed.',
      created_at: toIso(-1, 12, 15), is_read: true,
    },
  ];

  const availability = [
    { id: 'availability-1', referee_id: refereeId, start_time: toIso(0, 8, 0), end_time: toIso(0, 22, 0) },
    { id: 'availability-1b', referee_id: refereeId, start_time: toIso(2, 8, 0), end_time: toIso(2, 22, 0) },
    { id: 'availability-1c', referee_id: refereeId, start_time: toIso(4, 8, 0), end_time: toIso(4, 22, 0) },
    { id: 'availability-1d', referee_id: refereeId, start_time: toIso(5, 8, 0), end_time: toIso(5, 22, 0) },
    { id: 'availability-2', referee_id: 'ref-olivia', start_time: toIso(0, 8, 0), end_time: toIso(0, 22, 0) },
    { id: 'availability-2b', referee_id: 'ref-olivia', start_time: toIso(1, 8, 0), end_time: toIso(1, 22, 0) },
    { id: 'availability-3', referee_id: 'ref-jordan', start_time: toIso(1, 8, 0), end_time: toIso(1, 22, 0) },
    { id: 'availability-3b', referee_id: 'ref-jordan', start_time: toIso(2, 8, 0), end_time: toIso(2, 22, 0) },
  ];

  const gameReports = [
    {
      id: 'report-1', game_id: 'game-4', referee_id: refereeId, manager_id: managerId,
      home_score: 58, away_score: 54, professionalism_rating: 5,
      incidents: 'Minor bench warning in the third quarter.',
      notes: 'Fast-paced game with excellent sportsmanship in the final period.',
      technical_fouls: 1, personal_fouls: 14, ejections: 0,
      mvp_player: 'Marcus Johnson (Capital Cougars)',
      status: 'submitted', created_at: toIso(-2, 21, 10),
      resolution_note: null, resolved_by: null, resolved_at: null,
    },
  ];

  const refereeRatings = [
    {
      id: 'rating-seed-1', game_id: 'game-4', referee_id: refereeId, manager_id: managerId,
      stars: 5,
      feedback: 'Excellent game control and very professional throughout a tight final period.',
      created_at: toIso(-2, 21, 30),
    },
  ];

  const notifications = [
    { id: 'notif-seed-1', type: 'message', title: 'New message from Demo Manager', body: 'Welcome to the showcase weekend.', link: '/messages', read: false, created_at: toIso(-1, 8, 30), recipient_id: refereeId },
    { id: 'notif-seed-2', type: 'assignment', title: 'Game assigned: Metro Eagles vs Northside Lions', body: 'You have been assigned to officiate on Court 1.', link: '/schedule', read: false, created_at: toIso(-1, 9, 0), recipient_id: refereeId },
    { id: 'notif-seed-3', type: 'payment', title: 'Payment processed: $75', body: 'Capital Cougars vs Southside Rockets — Direct Deposit', link: '/payments', read: true, created_at: toIso(-2, 14, 30), recipient_id: refereeId },
    { id: 'notif-seed-4', type: 'game_request', title: 'New game request from Demo Referee', body: 'Demo Referee requested Lake City Panthers vs Harbor Heat.', link: '/manager', read: false, created_at: toIso(-1, 10, 0), recipient_id: managerId },
    { id: 'notif-seed-5', type: 'report', title: 'Game report submitted', body: 'Capital Cougars vs Southside Rockets — ready for your review.', link: '/manager', read: true, created_at: toIso(-2, 21, 10), recipient_id: managerId },
  ];

  const connections = [
    { id: 'conn-1', referee_id: refereeId, manager_id: managerId, status: 'connected', created_at: toIso(-30), note: 'Looking forward to working with your league!' },
    { id: 'conn-2', referee_id: refereeId, manager_id: 'mgr-thomas', status: 'pending', created_at: toIso(-2), note: 'I referee U14 and U16 divisions.' },
    { id: 'conn-3', referee_id: 'ref-olivia', manager_id: managerId, status: 'connected', created_at: toIso(-60), note: '' },
    { id: 'conn-5', referee_id: 'ref-jordan', manager_id: managerId, status: 'connected', created_at: toIso(-20), note: '' },
  ];

  const independentGames = [
    { id: 'indgame-001', referee_id: refereeId, date: toDateOnly(-60), time: '10:00', location: 'Riverside Community Center', organization: 'Atlanta Rec Spring League', game_type: 'league', fee: 75, notes: '', created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: 'indgame-002', referee_id: refereeId, date: toDateOnly(-45), time: '14:00', location: 'Northside Sports Complex', organization: 'Fulton County AAU', game_type: 'tournament', fee: 100, notes: 'Double-header weekend', created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
    { id: 'indgame-003', referee_id: refereeId, date: toDateOnly(-15), time: '11:30', location: 'Westside YMCA', organization: 'Youth Hoops Academy', game_type: 'scrimmage', fee: 60, notes: '', created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: 'indgame-004', referee_id: refereeId, date: toDateOnly(-5), time: '19:00', location: 'Decatur Recreation Hub', organization: 'Metro Playoff Series', game_type: 'playoff', fee: 90, notes: '', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'indgame-005', referee_id: refereeId, date: toDateOnly(4), time: '09:00', location: 'Emory University Gym', organization: 'Atlanta Rec Spring League', game_type: 'league', fee: 80, notes: 'U14 division', created_at: new Date().toISOString() },
  ];

  return { extraProfiles, tournaments, games, assignments, payments, messages, availability, gameReports, refereeRatings, notifications, connections, independentGames };
};

// Batch-write a collection of docs with known IDs
const batchWrite = async (batch, collectionName, items) => {
  items.forEach(({ id, ...data }) => {
    batch.set(doc(db, collectionName, id), data);
  });
};

const seedDemoData = async (managerId, refereeId) => {
  const seed = buildSeedData(managerId, refereeId);
  const BATCH_SIZE = 400; // Firestore batch limit is 500 operations

  const allWrites = [
    ...seed.extraProfiles.map(({ id, ...d }) => ({ col: 'users', id, data: d })),
    ...seed.tournaments.map(({ id, ...d }) => ({ col: 'tournaments', id, data: d })),
    ...seed.games.map(({ id, ...d }) => ({ col: 'games', id, data: d })),
    ...seed.assignments.map(({ id, ...d }) => ({ col: 'game_assignments', id, data: d })),
    ...seed.payments.map(({ id, ...d }) => ({ col: 'payments', id, data: d })),
    ...seed.messages.map(({ id, ...d }) => ({ col: 'messages', id, data: d })),
    ...seed.availability.map(({ id, ...d }) => ({ col: 'referee_availability', id, data: d })),
    ...seed.gameReports.map(({ id, ...d }) => ({ col: 'game_reports', id, data: d })),
    ...seed.refereeRatings.map(({ id, ...d }) => ({ col: 'referee_ratings', id, data: d })),
    ...seed.notifications.map(({ id, ...d }) => ({ col: 'notifications', id, data: d })),
    ...seed.connections.map(({ id, ...d }) => ({ col: 'manager_connections', id, data: d })),
    ...seed.independentGames.map(({ id, ...d }) => ({ col: 'independent_games', id, data: d })),
  ];

  // Split into batches
  for (let i = 0; i < allWrites.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    allWrites.slice(i, i + BATCH_SIZE).forEach(({ col, id, data }) => {
      batch.set(doc(db, col, id), data);
    });
    await batch.commit();
  }
};

export const checkAndSeedDemoData = async () => {
  try {
    // Already seeded?
    const seedDoc = await getDoc(doc(db, '_meta', 'demo_seed'));
    if (seedDoc.exists()) return;

    // Check if both demo users have profiles
    const [managerSnap, refereeSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('email', '==', 'manager@demo.com'))),
      getDocs(query(collection(db, 'users'), where('email', '==', 'referee@demo.com'))),
    ]);

    if (managerSnap.empty || refereeSnap.empty) return; // Wait for both

    const managerId = managerSnap.docs[0].id;
    const refereeId = refereeSnap.docs[0].id;

    await seedDemoData(managerId, refereeId);
    await setDoc(doc(db, '_meta', 'demo_seed'), { seeded: true, seeded_at: new Date().toISOString() });
    console.log('[iWhistle] Demo data seeded successfully');
  } catch (err) {
    console.error('[iWhistle] Seed error:', err);
  }
};
