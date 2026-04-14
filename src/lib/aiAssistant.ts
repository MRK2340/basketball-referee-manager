/**
 * aiAssistant.ts
 * Firebase AI Logic (Vertex AI) integration for the Manager AI Assistant.
 * Uses Gemini 2.5 Pro with function calling to convert natural language into actions.
 */
import app from './firebase';
import { getAI, getGenerativeModel, VertexAIBackend, type GenerativeModel } from 'firebase/ai';
import type { MappedGame, MappedTournament, MappedProfile } from './mappers';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AIAction {
  name: string;
  displayName: string;
  args: Record<string, unknown>;
  /** Human-readable summary */
  summary: string;
}

export interface AIResponse {
  text: string;
  actions: AIAction[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  actions?: AIAction[];
  actionsExecuted?: boolean;
  timestamp: number;
}

// ── Function Declarations ────────────────────────────────────────────────────

const functionDeclarations = [
  {
    name: 'create_games',
    description: 'Create one or more scheduled games in a tournament. Use this for single games, doubleheaders, or any batch of new games.',
    parameters: {
      type: 'object',
      properties: {
        games: {
          type: 'array',
          description: 'Array of games to create',
          items: {
            type: 'object',
            properties: {
              tournament_id: { type: 'string', description: 'ID of the tournament this game belongs to' },
              home_team: { type: 'string', description: 'Home team name' },
              away_team: { type: 'string', description: 'Away team name' },
              game_date: { type: 'string', description: 'Game date in YYYY-MM-DD format' },
              game_time: { type: 'string', description: 'Game time in HH:MM format (24-hour)' },
              venue: { type: 'string', description: 'Venue/location name' },
              division: { type: 'string', description: 'Division (e.g., U14 Boys)' },
              level: { type: 'string', description: 'Game level (e.g., Varsity, JV)' },
              payment_amount: { type: 'number', description: 'Referee payment amount in dollars' },
            },
            required: ['tournament_id', 'home_team', 'away_team', 'game_date', 'game_time', 'venue'],
          },
        },
      },
      required: ['games'],
    },
  },
  {
    name: 'create_tournament',
    description: 'Create a new tournament with the given details.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tournament name' },
        location: { type: 'string', description: 'Tournament location/venue' },
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format' },
        number_of_courts: { type: 'number', description: 'Number of courts available' },
      },
      required: ['name', 'location', 'start_date', 'end_date'],
    },
  },
  {
    name: 'assign_referee',
    description: 'Assign a referee to a specific game.',
    parameters: {
      type: 'object',
      properties: {
        game_id: { type: 'string', description: 'ID of the game to assign the referee to' },
        referee_id: { type: 'string', description: 'ID of the referee to assign' },
      },
      required: ['game_id', 'referee_id'],
    },
  },
  {
    name: 'update_game',
    description: 'Update an existing game\'s schedule, venue, or payment details.',
    parameters: {
      type: 'object',
      properties: {
        game_id: { type: 'string', description: 'ID of the game to update' },
        game_date: { type: 'string', description: 'New date in YYYY-MM-DD format (optional)' },
        game_time: { type: 'string', description: 'New time in HH:MM format (optional)' },
        venue: { type: 'string', description: 'New venue (optional)' },
        payment_amount: { type: 'number', description: 'New payment amount (optional)' },
        division: { type: 'string', description: 'New division (optional)' },
      },
      required: ['game_id'],
    },
  },
  {
    name: 'cancel_games',
    description: 'Cancel (delete) one or more games.',
    parameters: {
      type: 'object',
      properties: {
        game_ids: {
          type: 'array',
          description: 'Array of game IDs to cancel/delete',
          items: { type: 'string' },
        },
      },
      required: ['game_ids'],
    },
  },
  {
    name: 'complete_games',
    description: 'Mark one or more games as completed.',
    parameters: {
      type: 'object',
      properties: {
        game_ids: {
          type: 'array',
          description: 'Array of game IDs to mark as completed',
          items: { type: 'string' },
        },
      },
      required: ['game_ids'],
    },
  },
];

// ── Context Builder ──────────────────────────────────────────────────────────

const buildSystemPrompt = (
  tournaments: MappedTournament[],
  games: MappedGame[],
  referees: MappedProfile[],
): string => {
  const today = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  const tournamentList = tournaments.map(t =>
    `  - "${t.name}" (ID: ${t.id}, ${t.startDate} to ${t.endDate}, at ${t.location}, ${t.numberOfCourts} courts, ${t.games} games)`
  ).join('\n') || '  (none)';

  const upcomingGames = games
    .filter(g => g.status === 'scheduled')
    .slice(0, 15)
    .map(g =>
      `  - ${g.homeTeam} vs ${g.awayTeam} on ${g.date} at ${g.time} @ ${g.venue} (ID: ${g.id}, tournament: "${g.tournamentName}", $${g.payment}${g.assignments.length > 0 ? `, refs: ${g.assignments.map(a => a.referee.name).join(', ')}` : ', NO refs assigned'})`
    ).join('\n') || '  (none)';

  const refereeList = referees
    .slice(0, 20)
    .map(r =>
      `  - ${r.name} (ID: ${r.id}, rating: ${r.rating}, experience: ${r.experience || 'N/A'})`
    ).join('\n') || '  (none)';

  return `You are the iWhistle AI Manager Assistant for an AAU youth basketball league.
Today is ${dayOfWeek}, ${today}.

You help managers schedule games, create tournaments, assign referees, and manage their league — all from natural language.

CURRENT DATA:
Tournaments:
${tournamentList}

Upcoming Games:
${upcomingGames}

Available Referees:
${refereeList}

RULES:
- When the manager mentions a tournament by name, match it to the closest tournament above and use its ID.
- When they mention a referee by name, match and use their ID.
- When they say "this Saturday", "next Friday", etc., calculate the actual date from today (${today}, ${dayOfWeek}).
- For doubleheaders, create 2 separate games with different times.
- If teams aren't specified, use "TBD" as team names.
- Default payment is $75 if not specified.
- Default level is "Varsity" if not specified.
- Always confirm what you're about to do before executing. Describe the actions clearly.
- If you need more information to complete a request, ask for it.
- Be concise, friendly, and professional.`;
};

// ── Model Initialization ─────────────────────────────────────────────────────

let model: GenerativeModel | null = null;

const getModel = (): GenerativeModel => {
  if (!model) {
    const ai = getAI(app, { backend: new VertexAIBackend() });
    model = getGenerativeModel(ai, {
      model: 'gemini-2.5-pro',
      tools: [{ functionDeclarations }],
    });
  }
  return model;
};

// ── Chat Function ────────────────────────────────────────────────────────────

export const sendAssistantMessage = async (
  userMessage: string,
  chatHistory: ChatMessage[],
  context: {
    tournaments: MappedTournament[];
    games: MappedGame[];
    referees: MappedProfile[];
  },
): Promise<AIResponse> => {
  const gemini = getModel();
  const systemPrompt = buildSystemPrompt(context.tournaments, context.games, context.referees);

  // Build conversation history for Gemini
  const contents = [
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    { role: 'model' as const, parts: [{ text: 'Understood. I\'m your iWhistle AI Manager Assistant. How can I help you manage your league today?' }] },
    ...chatHistory
      .filter(m => m.text)
      .map(m => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }],
      })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const result = await gemini.generateContent({ contents });
  const response = result.response;
  const candidate = response.candidates?.[0];

  if (!candidate) {
    return { text: 'Sorry, I couldn\'t process that. Please try again.', actions: [] };
  }

  const actions: AIAction[] = [];
  let textParts: string[] = [];

  for (const part of candidate.content.parts) {
    if ('text' in part && part.text) {
      textParts.push(part.text);
    }
    if ('functionCall' in part && part.functionCall) {
      const fc = part.functionCall;
      const action = parseFunctionCall(fc.name, fc.args as Record<string, unknown>);
      if (action) actions.push(...action);
    }
  }

  const text = textParts.join('\n').trim() || (actions.length > 0
    ? `I'll execute ${actions.length} action${actions.length > 1 ? 's' : ''} for you. Please review and confirm.`
    : 'I\'m not sure how to help with that. Could you rephrase?');

  return { text, actions };
};

// ── Function Call Parser ─────────────────────────────────────────────────────

const parseFunctionCall = (name: string, args: Record<string, unknown>): AIAction[] | null => {
  switch (name) {
    case 'create_games': {
      const games = (args.games as Record<string, unknown>[]) || [];
      return games.map((g, i) => ({
        name: 'create_game',
        displayName: 'Create Game',
        args: g,
        summary: `${g.home_team || 'TBD'} vs ${g.away_team || 'TBD'} on ${g.game_date} at ${g.game_time} @ ${g.venue}${g.payment_amount ? ` ($${g.payment_amount})` : ''}`,
      }));
    }
    case 'create_tournament':
      return [{
        name: 'create_tournament',
        displayName: 'Create Tournament',
        args,
        summary: `"${args.name}" at ${args.location} (${args.start_date} to ${args.end_date})`,
      }];
    case 'assign_referee':
      return [{
        name: 'assign_referee',
        displayName: 'Assign Referee',
        args,
        summary: `Assign referee ${args.referee_id} to game ${args.game_id}`,
      }];
    case 'update_game':
      return [{
        name: 'update_game',
        displayName: 'Update Game',
        args,
        summary: `Update game ${args.game_id}${args.game_date ? ` → ${args.game_date}` : ''}${args.game_time ? ` at ${args.game_time}` : ''}${args.venue ? ` @ ${args.venue}` : ''}`,
      }];
    case 'cancel_games': {
      const ids = (args.game_ids as string[]) || [];
      return ids.map(id => ({
        name: 'cancel_game',
        displayName: 'Cancel Game',
        args: { game_id: id },
        summary: `Cancel game ${id}`,
      }));
    }
    case 'complete_games': {
      const ids = (args.game_ids as string[]) || [];
      return ids.map(id => ({
        name: 'complete_game',
        displayName: 'Complete Game',
        args: { game_id: id },
        summary: `Mark game ${id} as completed`,
      }));
    }
    default:
      return null;
  }
};
