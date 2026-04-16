/**
 * firestore/data.ts
 * Main app data fetcher — loads all collections for the authenticated user.
 */
import {
  db, collection, doc, getDoc, getDocs, query, where, orderBy, limit, documentId,
  docsToArr, chunkArray, toISOString,
  type Doc, type ServiceUser,
} from './helpers';
import {
  mapProfile, mapConnection, mapGame, mapTournament,
  mapPayment, mapMessage, mapAvailability, mapGameReport,
} from '../mappers';

const INITIAL_PAGE = 100;

export const fetchAppData = async (user: ServiceUser) => {
  if (!user) return {} as Doc;
  const isManager = user.role === 'manager';

  const [refereeUserSnap, managerUserSnap, currentUserSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('role', '==', 'referee'))),
    getDocs(query(collection(db, 'users'), where('role', '==', 'manager'))),
    getDoc(doc(db, 'users', user.id)),
  ]);
  const allReferees = docsToArr(refereeUserSnap).map(mapProfile);
  const managerProfilesRaw = docsToArr(managerUserSnap).map(mapProfile);
  const allUsers = [...allReferees, ...managerProfilesRaw];

  let gamesRaw: Doc[] = [], assignmentsRaw: Doc[] = [];
  if (isManager) {
    const [gSnap, aSnap] = await Promise.all([
      getDocs(query(collection(db, 'games'), where('manager_id', '==', user.id), orderBy('game_date', 'desc'), limit(100))),
      getDocs(query(collection(db, 'game_assignments'), where('manager_id', '==', user.id))),
    ]);
    gamesRaw = docsToArr(gSnap);
    assignmentsRaw = docsToArr(aSnap);
  } else {
    const aSnap = await getDocs(query(collection(db, 'game_assignments'), where('referee_id', '==', user.id)));
    assignmentsRaw = docsToArr(aSnap);
    const gameIds = [...new Set(assignmentsRaw.map(a => a.game_id))];
    if (gameIds.length > 0) {
      const chunks = chunkArray(gameIds, 30);
      const snapshots = await Promise.all(
        chunks.map(chunk =>
          getDocs(query(collection(db, 'games'), where(documentId(), 'in', chunk)))
        )
      );
      gamesRaw = snapshots.flatMap(docsToArr);
    }
  }

  const [
    tournamentsSnap, paymentsSnap, messagesSnap, notificationsSnap,
    availabilitySnap, gameReportsSnap, ratingsSnap, connectionsSnap,
    indGamesSnap,
  ] = await Promise.all([
    isManager
      ? getDocs(query(collection(db, 'tournaments'), where('manager_id', '==', user.id), orderBy('name'), limit(100)))
      : getDocs(query(collection(db, 'tournaments'), limit(100))),
    getDocs(isManager
      ? query(collection(db, 'payments'), where('manager_id', '==', user.id))
      : query(collection(db, 'payments'), where('referee_id', '==', user.id))),
    getDocs(query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.id),
      orderBy('created_at', 'desc'),
      limit(100),
    )),
    getDocs(query(
      collection(db, 'notifications'),
      where('recipient_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(100),
    )),
    getDocs(query(collection(db, 'referee_availability'), where('referee_id', '==', user.id))),
    getDocs(isManager
      ? query(collection(db, 'game_reports'), where('manager_id', '==', user.id))
      : query(collection(db, 'game_reports'), where('referee_id', '==', user.id))),
    getDocs(isManager
      ? collection(db, 'referee_ratings')
      : query(collection(db, 'referee_ratings'), where('referee_id', '==', user.id))),
    getDocs(isManager
      ? query(collection(db, 'manager_connections'), where('manager_id', '==', user.id))
      : query(collection(db, 'manager_connections'), where('referee_id', '==', user.id))),
    isManager
      ? Promise.resolve({ docs: [] } as unknown as Awaited<ReturnType<typeof getDocs>>)
      : getDocs(query(collection(db, 'independent_games'), where('referee_id', '==', user.id))),
  ]);

  const tournamentsRaw = docsToArr(tournamentsSnap);
  const paymentsRaw = docsToArr(paymentsSnap);
  const messagesRaw = docsToArr(messagesSnap);
  const notificationsRaw = docsToArr(notificationsSnap);
  const availabilityRaw = docsToArr(availabilitySnap);
  const gameReportsRaw = docsToArr(gameReportsSnap);
  const ratingsRaw = docsToArr(ratingsSnap);
  const connectionsRaw = docsToArr(connectionsSnap);
  const indGamesRaw = docsToArr(indGamesSnap);

  const savedPrefs = currentUserSnap.exists()
    ? (currentUserSnap.data()?.notification_preferences || {})
    : {};
  const notificationPreferences = {
    gameAssignments: true, scheduleChanges: true, paymentUpdates: true,
    messages: true, emailNotifications: true, pushNotifications: false, smsNotifications: false,
    ...savedPrefs,
  };

  const availabilityByReferee = new Map<string, ReturnType<typeof mapAvailability>[]>();
  availabilityRaw.forEach(a => {
    const list = availabilityByReferee.get(a.referee_id as string) || [];
    list.push(mapAvailability(a));
    availabilityByReferee.set(a.referee_id as string, list);
  });

  const sortedGames = [...gamesRaw].sort((a, b) => {
    const aStamp = `${a.game_date}T${a.game_time}`;
    const bStamp = `${b.game_date}T${b.game_time}`;
    return (bStamp as string).localeCompare(aStamp as string);
  });

  return {
    games: sortedGames.map(g => mapGame(g.id as string, g, assignmentsRaw, allUsers, tournamentsRaw)),
    payments: paymentsRaw.map(mapPayment),
    messages: messagesRaw
      .sort((a, b) => toISOString(b.created_at).localeCompare(toISOString(a.created_at)))
      .map(m => mapMessage(m, allUsers)),
    notifications: notificationsRaw.sort((a, b) => toISOString(b.created_at).localeCompare(toISOString(a.created_at))),
    tournaments: tournamentsRaw.map(t => mapTournament(t, gamesRaw)),
    referees: allReferees.map(r => ({
      ...r,
      availability: availabilityByReferee.get(r.id) || [],
    })),
    availability: availabilityRaw.map(mapAvailability),
    gameReports: gameReportsRaw.map(r => mapGameReport(r, gamesRaw, allUsers)),
    refereeRatings: ratingsRaw.sort((a, b) => ((b.created_at || '') as string).localeCompare((a.created_at || '') as string)),
    notificationPreferences,
    connections: connectionsRaw.map(mapConnection),
    managerProfiles: managerProfilesRaw,
    independentGames: indGamesRaw.sort((a, b) => ((b.date || '') as string).localeCompare((a.date || '') as string)),
    hasMoreGames: isManager && gamesRaw.length === INITIAL_PAGE,
    hasMoreTournaments: isManager && tournamentsRaw.length === INITIAL_PAGE,
    hasMoreMessages: messagesRaw.length === INITIAL_PAGE,
    hasMoreNotifications: notificationsRaw.length === INITIAL_PAGE,
  };
};
