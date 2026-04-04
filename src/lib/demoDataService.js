const STORAGE_KEY = 'iwhistle_demo_data_v3';
const USER_STORAGE_KEY = 'iwhistle_users';

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toDateOnly = (offsetDays = 0) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const toIsoFromToday = (offsetDays = 0, hour = 9, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

const createError = (message, code) => ({ message, code });

const createNotification = (store, recipientId, type, title, body, link = '/') => {
  if (!store.notifications) store.notifications = [];
  store.notifications.unshift({
    id: createId('notif'),
    type,
    title,
    body,
    link,
    read: false,
    created_at: new Date().toISOString(),
    recipient_id: recipientId,
  });
};

const getStoredUsers = () => parseJson(localStorage.getItem(USER_STORAGE_KEY), []);

const createSeedStore = () => ({
  profiles: [
    {
      id: 'demo-manager',
      email: 'manager@demo.com',
      name: 'Demo Manager',
      role: 'manager',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
      rating: 5,
      experience: '10 years',
      phone: '+1 555 0199',
      certifications: ['Tournament Director'],
      games_officiated: 0,
    },
    {
      id: 'demo-referee',
      email: 'referee@demo.com',
      name: 'Demo Referee',
      role: 'referee',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=referee',
      rating: 4.8,
      experience: '3 years',
      phone: '+1 555 0123',
      certifications: ['Certified Official Level 1', 'NFHS Certified'],
      games_officiated: 42,
    },
    {
      id: 'ref-olivia',
      email: 'olivia@demo.com',
      name: 'Olivia Brooks',
      role: 'referee',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia',
      rating: 4.9,
      experience: '6 years',
      phone: '+1 555 0177',
      certifications: ['NFHS Certified', 'AAU Elite'],
      games_officiated: 118,
    },
    {
      id: 'ref-jordan',
      email: 'jordan@demo.com',
      name: 'Jordan Ellis',
      role: 'referee',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
      rating: 4.6,
      experience: '4 years',
      phone: '+1 555 0144',
      certifications: ['Certified Official Level 2'],
      games_officiated: 76,
    },
  ],
  tournaments: [
    {
      id: 'tournament-spring',
      name: 'Spring Showcase Classic',
      start_date: toDateOnly(-2),
      end_date: toDateOnly(9),
      location: 'Metro Sports Complex',
      number_of_courts: 4,
      manager_id: 'demo-manager',
    },
    {
      id: 'tournament-summer',
      name: 'Summer Prep Jam',
      start_date: toDateOnly(18),
      end_date: toDateOnly(22),
      location: 'Riverside Fieldhouse',
      number_of_courts: 3,
      manager_id: 'demo-manager',
    },
  ],
  games: [
    {
      id: 'game-1',
      tournament_id: 'tournament-spring',
      home_team: 'Metro Eagles',
      away_team: 'Northside Lions',
      game_date: toDateOnly(1),
      game_time: '18:00:00',
      venue: 'Court 1',
      status: 'scheduled',
      payment_amount: 65,
      division: 'U14 Boys',
      level: 'Varsity',
      required_certifications: ['NFHS Certified'],
    },
    {
      id: 'game-2',
      tournament_id: 'tournament-spring',
      home_team: 'Central Storm',
      away_team: 'Westview Falcons',
      game_date: toDateOnly(2),
      game_time: '19:30:00',
      venue: 'Court 2',
      status: 'scheduled',
      payment_amount: 70,
      division: 'U16 Girls',
      level: 'JV',
      required_certifications: ['Certified Official Level 1'],
    },
    {
      id: 'game-3',
      tournament_id: 'tournament-spring',
      home_team: 'Lake City Panthers',
      away_team: 'Harbor Heat',
      game_date: toDateOnly(4),
      game_time: '16:00:00',
      venue: 'Court 3',
      status: 'scheduled',
      payment_amount: 60,
      division: 'U13 Boys',
      level: 'Regional',
      required_certifications: ['AAU Elite'],
    },
    {
      id: 'game-4',
      tournament_id: 'tournament-spring',
      home_team: 'Capital Cougars',
      away_team: 'Southside Rockets',
      game_date: toDateOnly(-3),
      game_time: '17:15:00',
      venue: 'Court 1',
      status: 'completed',
      payment_amount: 75,
      division: 'U15 Boys',
      level: 'Showcase',
      required_certifications: ['Certified Official Level 1'],
      home_score: 58,
      away_score: 54,
    },
    {
      id: 'game-5',
      tournament_id: 'tournament-summer',
      home_team: 'River City Bulls',
      away_team: 'Eastside Thunder',
      game_date: toDateOnly(4),
      game_time: '16:30:00',
      venue: 'Court 2',
      status: 'scheduled',
      payment_amount: 70,
      division: 'U15 Boys',
      level: 'Varsity',
      required_certifications: ['Certified Official Level 2'],
    },
  ],
  gameAssignments: [
    { id: 'assignment-1', game_id: 'game-1', referee_id: 'demo-referee', status: 'assigned', decline_reason: null },
    { id: 'assignment-2', game_id: 'game-3', referee_id: 'ref-olivia', status: 'accepted', decline_reason: null },
    { id: 'assignment-3', game_id: 'game-3', referee_id: 'ref-jordan', status: 'assigned', decline_reason: null },
    { id: 'assignment-4', game_id: 'game-4', referee_id: 'demo-referee', status: 'accepted', decline_reason: null },
    { id: 'assignment-5', game_id: 'game-5', referee_id: 'ref-jordan', status: 'accepted', decline_reason: null },
  ],
  payments: [
    {
      id: 'payment-1',
      game_id: 'game-4',
      referee_id: 'demo-referee',
      amount: 75,
      status: 'paid',
      payment_date: toDateOnly(-1),
      payment_method: 'Direct Deposit',
    },
  ],
  messages: [
    {
      id: 'message-1',
      sender_id: 'demo-manager',
      recipient_id: 'demo-referee',
      subject: 'Welcome to the showcase weekend',
      content: 'You are scheduled for Friday evening and can request any open games that fit your availability.',
      created_at: toIsoFromToday(-1, 8, 30),
      is_read: false,
    },
    {
      id: 'message-2',
      sender_id: 'demo-referee',
      recipient_id: 'demo-manager',
      subject: 'Travel timing confirmed',
      content: 'I will arrive 30 minutes before my Friday assignment and can stay late if needed.',
      created_at: toIsoFromToday(-1, 12, 15),
      is_read: true,
    },
  ],
  refereeAvailability: [
    {
      id: 'availability-1',
      referee_id: 'demo-referee',
      start_time: toIsoFromToday(1, 8, 0),
      end_time: toIsoFromToday(2, 22, 0),
    },
    {
      id: 'availability-2',
      referee_id: 'ref-olivia',
      start_time: toIsoFromToday(3, 8, 0),
      end_time: toIsoFromToday(5, 22, 0),
    },
  ],
  gameReports: [
    {
      id: 'report-1',
      game_id: 'game-4',
      referee_id: 'demo-referee',
      manager_id: 'demo-manager',
      home_score: 58,
      away_score: 54,
      professionalism_rating: 5,
      incidents: 'Minor bench warning in the third quarter.',
      notes: 'Fast-paced game with excellent sportsmanship in the final period.',
      technical_fouls: 1,
      personal_fouls: 14,
      ejections: 0,
      mvp_player: 'Marcus Johnson (Capital Cougars)',
      status: 'submitted',
      created_at: toIsoFromToday(-2, 21, 10),
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
    },
  ],
  courtAssignments: [],
  refereeRatings: [
    {
      id: 'rating-seed-1',
      game_id: 'game-4',
      referee_id: 'demo-referee',
      manager_id: 'demo-manager',
      stars: 5,
      feedback: 'Excellent game control and very professional throughout a tight final period. Excellent communication with players.',
      created_at: toIsoFromToday(-2, 21, 30),
    },
  ],
  notificationPreferences: {},
  notifications: [
    {
      id: 'notif-seed-1',
      type: 'message',
      title: 'New message from Demo Manager',
      body: 'Welcome to the showcase weekend — you are scheduled for Friday.',
      link: '/messages',
      read: false,
      created_at: toIsoFromToday(-1, 8, 30),
      recipient_id: 'demo-referee',
    },
    {
      id: 'notif-seed-2',
      type: 'assignment',
      title: 'Game assigned: Metro Eagles vs Northside Lions',
      body: 'You have been assigned to officiate on Court 1.',
      link: '/schedule',
      read: false,
      created_at: toIsoFromToday(-1, 9, 0),
      recipient_id: 'demo-referee',
    },
    {
      id: 'notif-seed-3',
      type: 'payment',
      title: 'Payment processed: $75',
      body: 'Capital Cougars vs Southside Rockets — Direct Deposit',
      link: '/payments',
      read: true,
      created_at: toIsoFromToday(-2, 14, 30),
      recipient_id: 'demo-referee',
    },
    {
      id: 'notif-seed-4',
      type: 'game_request',
      title: 'New game request from Demo Referee',
      body: 'Demo Referee requested Lake City Panthers vs Harbor Heat.',
      link: '/manager',
      read: false,
      created_at: toIsoFromToday(-1, 10, 0),
      recipient_id: 'demo-manager',
    },
    {
      id: 'notif-seed-5',
      type: 'report',
      title: 'Game report submitted',
      body: 'Capital Cougars vs Southside Rockets — ready for your review.',
      link: '/manager',
      read: true,
      created_at: toIsoFromToday(-2, 21, 10),
      recipient_id: 'demo-manager',
    },
  ],
});

const syncProfiles = (store) => {
  const users = getStoredUsers();
  const profiles = [...(store.profiles || [])];

  users.forEach((user) => {
    const nextProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'referee',
      avatar_url: user.avatar_url,
      phone: user.phone || '',
      experience: user.experience || '',
      rating: user.rating ?? (user.role === 'manager' ? 5 : 4.5),
      certifications: user.certifications || [],
      games_officiated: user.games_officiated || 0,
    };

    const existingIndex = profiles.findIndex((profile) => profile.id === user.id);
    if (existingIndex >= 0) {
      profiles[existingIndex] = { ...profiles[existingIndex], ...nextProfile };
    } else {
      profiles.push(nextProfile);
    }
  });

  return { ...store, profiles };
};

const saveStore = (store) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const loadStore = () => {
  const stored = parseJson(localStorage.getItem(STORAGE_KEY), null);
  const base = stored || createSeedStore();
  if (!base.notifications) {
    base.notifications = createSeedStore().notifications;
  }
  if (!base.refereeRatings) {
    base.refereeRatings = createSeedStore().refereeRatings;
  }
  if (!base.notificationPreferences) {
    base.notificationPreferences = {};
  }
  const synced = syncProfiles(base);
  saveStore(synced);
  return synced;
};

const getProfileById = (store, id) => store.profiles.find((profile) => profile.id === id);

const mapAssignment = (assignment, store) => {
  const refereeProfile = getProfileById(store, assignment.referee_id) || {};
  return {
    id: assignment.id,
    status: assignment.status,
    declineReason: assignment.decline_reason,
    decline_reason: assignment.decline_reason,
    refereeId: assignment.referee_id,
    referee_id: assignment.referee_id,
    referee: {
      id: refereeProfile.id,
      name: refereeProfile.name || 'Unassigned Referee',
      avatarUrl: refereeProfile.avatar_url,
      avatar_url: refereeProfile.avatar_url,
      email: refereeProfile.email,
    },
    profiles: {
      id: refereeProfile.id,
      name: refereeProfile.name || 'Unassigned Referee',
      avatar_url: refereeProfile.avatar_url,
      email: refereeProfile.email,
    },
  };
};

const mapGame = (game, store) => {
  const tournament = store.tournaments.find((item) => item.id === game.tournament_id);
  const assignments = store.gameAssignments
    .filter((assignment) => assignment.game_id === game.id)
    .map((assignment) => mapAssignment(assignment, store));

  return {
    id: game.id,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    home_team: game.home_team,
    away_team: game.away_team,
    date: game.game_date,
    time: game.game_time?.slice(0, 5) || game.game_time,
    game_date: game.game_date,
    game_time: game.game_time,
    venue: game.venue,
    status: game.status,
    payment: game.payment_amount,
    payment_amount: game.payment_amount,
    division: game.division,
    level: game.level,
    requiredCertifications: game.required_certifications || [],
    required_certifications: game.required_certifications || [],
    homeScore: game.home_score,
    awayScore: game.away_score,
    home_score: game.home_score,
    away_score: game.away_score,
    tournamentId: game.tournament_id,
    tournament_id: game.tournament_id,
    tournamentName: tournament?.name || 'Independent Game',
    managerId: tournament?.manager_id || null,
    manager_id: tournament?.manager_id || null,
    tournament: tournament
      ? { id: tournament.id, name: tournament.name, manager_id: tournament.manager_id }
      : null,
    assignments,
    game_assignments: assignments,
  };
};

const mapTournament = (tournament, store) => ({
  id: tournament.id,
  name: tournament.name,
  startDate: tournament.start_date,
  endDate: tournament.end_date,
  start_date: tournament.start_date,
  end_date: tournament.end_date,
  location: tournament.location,
  numberOfCourts: tournament.number_of_courts,
  number_of_courts: tournament.number_of_courts,
  managerId: tournament.manager_id,
  manager_id: tournament.manager_id,
  games: store.games.filter((game) => game.tournament_id === tournament.id).length,
  refereesNeeded: 0,
});

const mapPayment = (payment) => ({
  id: payment.id,
  gameId: payment.game_id,
  game_id: payment.game_id,
  amount: payment.amount,
  status: payment.status,
  date: payment.payment_date,
  payment_date: payment.payment_date,
  method: payment.payment_method,
  payment_method: payment.payment_method,
  refereeId: payment.referee_id,
  referee_id: payment.referee_id,
});

const mapMessage = (message, store) => {
  const sender = getProfileById(store, message.sender_id) || { name: 'System' };
  return {
    id: message.id,
    from: sender.name || 'System',
    fromAvatar: sender.avatar_url,
    subject: message.subject,
    content: message.content,
    timestamp: message.created_at,
    created_at: message.created_at,
    read: message.is_read,
    is_read: message.is_read,
    sender_id: message.sender_id,
    recipient_id: message.recipient_id,
  };
};

const mapAvailability = (availability) => ({
  id: availability.id,
  startTime: availability.start_time,
  endTime: availability.end_time,
  start_time: availability.start_time,
  end_time: availability.end_time,
});

const mapGameReport = (report, store) => {
  const game = store.games.find((item) => item.id === report.game_id);
  const referee = getProfileById(store, report.referee_id);
  return {
    id: report.id,
    gameId: report.game_id,
    game_id: report.game_id,
    gameTitle: game ? `${game.home_team} vs ${game.away_team}` : 'Game Report',
    refereeId: report.referee_id,
    referee_id: report.referee_id,
    refereeName: referee?.name || 'Referee',
    managerId: report.manager_id,
    manager_id: report.manager_id,
    homeScore: report.home_score,
    home_score: report.home_score,
    awayScore: report.away_score,
    away_score: report.away_score,
    professionalismRating: report.professionalism_rating,
    professionalism_rating: report.professionalism_rating,
    incidents: report.incidents,
    notes: report.notes,
    technicalFouls: report.technical_fouls ?? null,
    personalFouls: report.personal_fouls ?? null,
    ejections: report.ejections ?? null,
    mvpPlayer: report.mvp_player || null,
    status: report.status,
    createdAt: report.created_at,
    created_at: report.created_at,
    resolutionNote: report.resolution_note || null,
    resolvedBy: report.resolved_by || null,
    resolvedAt: report.resolved_at || null,
  };
};

const mapReferee = (profile, store) => ({
  ...profile,
  referee_availability: store.refereeAvailability.filter((slot) => slot.referee_id === profile.id),
});

const updateStore = (updater) => {
  const draft = clone(loadStore());
  const result = updater(draft);

  if (result?.error) {
    return result;
  }

  saveStore(draft);
  return { data: result?.data ?? null, store: draft };
};

const createMessage = (store, senderId, recipientId, subject, content) => {
  store.messages.unshift({
    id: createId('message'),
    sender_id: senderId,
    recipient_id: recipientId,
    subject,
    content,
    created_at: new Date().toISOString(),
    is_read: false,
  });
};

const getFallbackRecipientId = (store, user) => {
  const targetRole = user.role === 'manager' ? 'referee' : 'manager';
  return store.profiles.find((profile) => profile.role === targetRole)?.id || null;
};

export const fetchAppData = (user, page = 1, pageSize = 20) => {
  const store = loadStore();
  const sortedGames = [...store.games].sort((left, right) => {
    const leftStamp = `${left.game_date}T${left.game_time}`;
    const rightStamp = `${right.game_date}T${right.game_time}`;
    return rightStamp.localeCompare(leftStamp);
  });
  const sliceStart = (page - 1) * pageSize;
  const sliceEnd = sliceStart + pageSize;

  const payments = user.role === 'manager'
    ? store.payments
    : store.payments.filter((payment) => payment.referee_id === user.id);

  const messages = store.messages.filter(
    (message) => message.sender_id === user.id || message.recipient_id === user.id
  );

  return {
    games: sortedGames.slice(sliceStart, sliceEnd).map((game) => mapGame(game, store)),
    payments: payments.map(mapPayment),
    messages: messages
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .map((message) => mapMessage(message, store)),
    notifications: (store.notifications || [])
      .filter((n) => n.recipient_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    tournaments: store.tournaments.map((tournament) => mapTournament(tournament, store)),
    referees: store.profiles.filter((profile) => profile.role === 'referee').map((profile) => mapReferee(profile, store)),
    availability: store.refereeAvailability
      .filter((slot) => slot.referee_id === user.id)
      .map(mapAvailability),
    gameReports: store.gameReports.map((report) => mapGameReport(report, store)),
    refereeRatings: (store.refereeRatings || [])
      .filter((r) => user.role === 'referee' ? r.referee_id === user.id : true)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    notificationPreferences: (store.notificationPreferences || {})[user.id] || {
      gameAssignments: true,
      scheduleChanges: true,
      paymentUpdates: true,
      messages: true,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
  };
};

export const addTournament = (user, tournamentData) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can add tournaments.') };
  }

  store.tournaments.unshift({
    id: createId('tournament'),
    name: tournamentData.name,
    start_date: tournamentData.startDate,
    end_date: tournamentData.endDate,
    location: tournamentData.location,
    number_of_courts: Number(tournamentData.numberOfCourts),
    manager_id: user.id,
  });

  return { data: true };
});

export const updateTournamentRecord = (user, tournamentId, tournamentData) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can update tournaments.') };
  }

  const tournament = store.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) {
    return { error: createError('Tournament not found.') };
  }

  tournament.name = tournamentData.name;
  tournament.start_date = tournamentData.startDate;
  tournament.end_date = tournamentData.endDate;
  tournament.location = tournamentData.location;
  tournament.number_of_courts = Number(tournamentData.numberOfCourts);
  return { data: true };
});

export const addGameRecord = (user, gameData) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can schedule games.') };
  }

  store.games.unshift({
    id: createId('game'),
    ...gameData,
    game_time: gameData.game_time.length === 5 ? `${gameData.game_time}:00` : gameData.game_time,
  });
  return { data: true };
});

export const markGameCompleted = (user, gameId) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can complete games.') };
  }

  const game = store.games.find((item) => item.id === gameId);
  if (!game) {
    return { error: createError('Game not found.') };
  }

  game.status = 'completed';
  const activeAssignments = store.gameAssignments.filter(
    (assignment) => assignment.game_id === gameId && assignment.status !== 'declined'
  );

  activeAssignments.forEach((assignment) => {
    const paymentExists = store.payments.some(
      (payment) => payment.game_id === gameId && payment.referee_id === assignment.referee_id
    );
    if (!paymentExists) {
      store.payments.unshift({
        id: createId('payment'),
        game_id: gameId,
        referee_id: assignment.referee_id,
        amount: game.payment_amount,
        status: 'pending',
        payment_date: toDateOnly(2),
        payment_method: 'Direct Deposit',
      });
    }

    createMessage(
      store,
      user.id,
      assignment.referee_id,
      `Game completed: ${game.home_team} vs ${game.away_team}`,
      'The game has been marked complete and your payment is now pending review.'
    );
  });

  return { data: true };
});

export const assignReferee = (user, gameId, refereeId) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can assign referees.') };
  }

  const duplicate = store.gameAssignments.find(
    (assignment) => assignment.game_id === gameId && assignment.referee_id === refereeId
  );
  if (duplicate) {
    return { error: createError('This referee is already assigned to the game.', '23505') };
  }

  store.gameAssignments.push({
    id: createId('assignment'),
    game_id: gameId,
    referee_id: refereeId,
    status: 'assigned',
    decline_reason: null,
  });

  const game = store.games.find((item) => item.id === gameId);
  if (game) {
    createMessage(
      store,
      user.id,
      refereeId,
      `New assignment: ${game.home_team} vs ${game.away_team}`,
      `You have been assigned to officiate on ${game.game_date} at ${game.game_time.slice(0, 5)}.`
    );
    createNotification(
      store,
      refereeId,
      'assignment',
      `Game assigned: ${game.home_team} vs ${game.away_team}`,
      `You have been assigned to officiate on ${game.game_date} at ${game.game_time.slice(0, 5)}.`,
      '/schedule'
    );
  }

  return { data: true };
});

export const unassignReferee = (user, assignmentId) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can remove assignments.') };
  }

  store.gameAssignments = store.gameAssignments.filter((assignment) => assignment.id !== assignmentId);
  return { data: true };
});

export const updateAssignment = (user, assignmentId, status, reason = null) => updateStore((store) => {
  const assignment = store.gameAssignments.find((item) => item.id === assignmentId && item.referee_id === user?.id);
  if (!assignment) {
    return { error: createError('Assignment not found.') };
  }

  assignment.status = status;
  assignment.decline_reason = status === 'declined' ? reason : null;

  const game = store.games.find((item) => item.id === assignment.game_id);
  const tournament = game ? store.tournaments.find((item) => item.id === game.tournament_id) : null;
  if (game && tournament?.manager_id) {
    const msgBody = status === 'declined'
      ? `${user.name} declined the assignment. Reason: ${reason || 'No reason provided.'}`
      : `${user.name} accepted the assignment.`;
    createMessage(
      store,
      user.id,
      tournament.manager_id,
      `Assignment ${status}: ${game.home_team} vs ${game.away_team}`,
      msgBody
    );
    createNotification(
      store,
      tournament.manager_id,
      'assignment',
      `${user.name} ${status === 'declined' ? 'declined' : 'accepted'}: ${game.home_team} vs ${game.away_team}`,
      msgBody,
      '/manager'
    );
  }

  return { data: true };
});

export const assignCourtSchedule = (user, assignments) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can assign court schedules.') };
  }

  assignments.forEach((assignment) => {
    store.courtAssignments.push({
      id: createId('court-assignment'),
      ...assignment,
    });
  });

  return { data: true };
});

export const requestAssignment = (user, gameId) => updateStore((store) => {
  if (!user || user.role !== 'referee') {
    return { error: createError('Only referees can request games.') };
  }

  const duplicate = store.gameAssignments.find(
    (assignment) => assignment.game_id === gameId && assignment.referee_id === user.id
  );
  if (duplicate) {
    return { error: createError('You have already requested this game.', '23505') };
  }

  store.gameAssignments.push({
    id: createId('assignment'),
    game_id: gameId,
    referee_id: user.id,
    status: 'requested',
    decline_reason: null,
  });

  const game = store.games.find((item) => item.id === gameId);
  const tournament = game ? store.tournaments.find((item) => item.id === game.tournament_id) : null;
  if (game && tournament?.manager_id) {
    createMessage(
      store,
      user.id,
      tournament.manager_id,
      `New game request: ${game.home_team} vs ${game.away_team}`,
      `${user.name} requested to officiate this game.`
    );
    createNotification(
      store,
      tournament.manager_id,
      'game_request',
      `New game request from ${user.name}`,
      `${user.name} requested: ${game.home_team} vs ${game.away_team}.`,
      '/manager'
    );
  }

  return { data: true };
});

export const sendMessageRecord = (user, messageData) => updateStore((store) => {
  if (!user) {
    return { error: createError('You must be signed in to send messages.') };
  }

  const recipientId = messageData.recipientId || getFallbackRecipientId(store, user);
  if (!recipientId) {
    return { error: createError('No valid message recipient was found.') };
  }

  createMessage(store, user.id, recipientId, messageData.subject, messageData.content);
  createNotification(
    store,
    recipientId,
    'message',
    `New message from ${user.name}`,
    messageData.subject,
    '/messages'
  );
  return { data: true };
});

export const markMessageRead = (user, messageId) => updateStore((store) => {
  const message = store.messages.find((item) => item.id === messageId && item.recipient_id === user?.id);
  if (!message) {
    return { error: createError('Message not found.') };
  }

  message.is_read = true;
  return { data: true };
});

export const addAvailabilityRecord = (user, startDate, endDate) => updateStore((store) => {
  if (!user || user.role !== 'referee') {
    return { error: createError('Only referees can update availability.') };
  }

  store.refereeAvailability.push({
    id: createId('availability'),
    referee_id: user.id,
    start_time: startDate,
    end_time: endDate,
  });

  return { data: true };
});

export const submitGameReportRecord = (user, reportData) => updateStore((store) => {
  if (!user || user.role !== 'referee') {
    return { error: createError('Only referees can submit reports.') };
  }

  const duplicate = store.gameReports.find(
    (report) => report.game_id === reportData.game_id && report.referee_id === user.id
  );
  if (duplicate) {
    return { error: createError('A report for this game has already been submitted.') };
  }

  store.gameReports.unshift({
    id: createId('report'),
    ...reportData,
    status: 'submitted',
    created_at: new Date().toISOString(),
  });

  const game = store.games.find((item) => item.id === reportData.game_id);
  if (game) {
    game.status = 'completed';
    game.home_score = reportData.home_score;
    game.away_score = reportData.away_score;
  }

  const profile = getProfileById(store, user.id);
  if (profile) {
    profile.games_officiated = (profile.games_officiated || 0) + 1;
  }

  const paymentExists = store.payments.some(
    (payment) => payment.game_id === reportData.game_id && payment.referee_id === user.id
  );
  if (game && !paymentExists) {
    store.payments.unshift({
      id: createId('payment'),
      game_id: reportData.game_id,
      referee_id: user.id,
      amount: game.payment_amount,
      status: 'pending',
      payment_date: toDateOnly(2),
      payment_method: 'Direct Deposit',
    });
  }

  if (reportData.manager_id) {
    createMessage(
      store,
      user.id,
      reportData.manager_id,
      `Game report submitted: ${game?.home_team || 'Game'} vs ${game?.away_team || ''}`,
      'A completed game report is ready for your review.'
    );
    createNotification(
      store,
      reportData.manager_id,
      'report',
      'Game report submitted',
      `${game?.home_team || 'Game'} vs ${game?.away_team || ''} — ready for your review.`,
      '/manager'
    );
  }

  return { data: true };
});

export const deleteTournamentRecord = (user, tournamentId) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can delete tournaments.') };
  }

  const tournamentGameIds = store.games
    .filter((game) => game.tournament_id === tournamentId)
    .map((game) => game.id);

  store.gameAssignments = store.gameAssignments.filter(
    (a) => !tournamentGameIds.includes(a.game_id)
  );
  store.payments = store.payments.filter(
    (p) => !tournamentGameIds.includes(p.game_id)
  );
  store.gameReports = store.gameReports.filter(
    (r) => !tournamentGameIds.includes(r.game_id)
  );
  store.games = store.games.filter((g) => g.tournament_id !== tournamentId);
  store.tournaments = store.tournaments.filter((t) => t.id !== tournamentId);

  return { data: true };
});

export const markNotificationReadRecord = (user, notificationId) => updateStore((store) => {
  if (!store.notifications) return { data: null };
  const notif = store.notifications.find(
    (n) => n.id === notificationId && n.recipient_id === user?.id
  );
  if (notif) notif.read = true;
  return { data: true };
});

export const batchUnassignRefereesRecord = (user, gameIds) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can unassign referees.') };
  }
  store.gameAssignments = store.gameAssignments.filter((a) => !gameIds.includes(a.game_id));
  return { data: true };
});

export const batchMarkPaymentsPaidRecord = (user, paymentIds) => updateStore((store) => {
  paymentIds.forEach((id) => {
    const payment = store.payments.find((p) => p.id === id);
    if (payment) payment.status = 'paid';
  });
  return { data: true };
});


export const markAllNotificationsReadRecord = (user) => updateStore((store) => {
  if (!store.notifications) return { data: null };
  store.notifications
    .filter((n) => n.recipient_id === user?.id)
    .forEach((n) => { n.read = true; });
  return { data: true };
});

export const rateRefereeRecord = (user, gameId, refereeId, stars, feedback) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can rate referees.') };
  }
  if (!store.refereeRatings) store.refereeRatings = [];

  const existing = store.refereeRatings.find(
    (r) => r.game_id === gameId && r.referee_id === refereeId
  );
  if (existing) {
    existing.stars = stars;
    existing.feedback = feedback;
  } else {
    store.refereeRatings.unshift({
      id: createId('rating'),
      game_id: gameId,
      referee_id: refereeId,
      manager_id: user.id,
      stars,
      feedback,
      created_at: new Date().toISOString(),
    });
  }

  const referee = store.profiles.find((p) => p.id === refereeId);
  if (referee) {
    const refRatings = store.refereeRatings.filter((r) => r.referee_id === refereeId);
    referee.rating = Math.round((refRatings.reduce((sum, r) => sum + r.stars, 0) / refRatings.length) * 10) / 10;
  }

  const game = store.games.find((g) => g.id === gameId);
  if (game) {
    createNotification(
      store, refereeId, 'payment',
      `Performance rating received`,
      `You received a ${stars}-star rating for ${game.home_team} vs ${game.away_team}.`,
      '/profile'
    );
  }
  return { data: true };
});

export const saveNotificationPreferencesRecord = (user, prefs) => updateStore((store) => {
  if (!store.notificationPreferences) store.notificationPreferences = {};
  store.notificationPreferences[user.id] = prefs;
  return { data: true };
});

export const addReportResolutionRecord = (user, reportId, note) => updateStore((store) => {
  if (!user || user.role !== 'manager') {
    return { error: createError('Only managers can resolve reports.') };
  }
  const report = store.gameReports.find((r) => r.id === reportId);
  if (!report) return { error: createError('Report not found.') };
  report.resolution_note = note;
  report.resolved_by = user.id;
  report.resolved_at = new Date().toISOString();
  report.status = 'reviewed';
  return { data: true };
});
