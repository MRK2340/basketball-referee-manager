/**
 * refereeAiAssistant.ts
 * Firebase AI Logic (Vertex AI) integration for the Referee AI Assistant.
 * Uses Gemini 2.5 Pro with function calling for referee-specific actions.
 */
import app from './firebase';
import { getAI, getGenerativeModel, VertexAIBackend, type GenerativeModel } from 'firebase/ai';
import { traceAsync } from './performanceTraces';
import type { MappedGame, MappedProfile } from './mappers';
import type { AIAction, AIResponse, ChatMessage } from './aiAssistant';

// Re-export shared types
export type { AIAction, AIResponse, ChatMessage };

// ── Referee Function Declarations ────────────────────────────────────────────

const refereeFunctionDeclarations = [
  {
    name: 'query_schedule',
    description: 'Look up the referee\'s upcoming or past game assignments. Use for questions like "What games do I have this weekend?" or "Show my schedule for May".',
    parameters: {
      type: 'object',
      properties: {
        time_range: { type: 'string', description: 'Time range: "today", "this_week", "this_weekend", "next_week", "this_month", or a specific date YYYY-MM-DD' },
        include_past: { type: 'boolean', description: 'Whether to include past games (default false)' },
      },
      required: ['time_range'],
    },
  },
  {
    name: 'check_availability',
    description: 'Check if the referee has availability logged for a specific date or range.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date to check in YYYY-MM-DD format' },
      },
      required: ['date'],
    },
  },
  {
    name: 'set_availability',
    description: 'Mark the referee as available for one or more dates.',
    parameters: {
      type: 'object',
      properties: {
        dates: {
          type: 'array',
          description: 'Array of dates in YYYY-MM-DD format to mark as available',
          items: { type: 'string' },
        },
      },
      required: ['dates'],
    },
  },
  {
    name: 'query_earnings',
    description: 'Look up the referee\'s total earnings, game count, or fee information.',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', description: '"all_time", "this_month", "this_year", or "last_month"' },
      },
      required: ['period'],
    },
  },
  {
    name: 'send_message',
    description: 'Send a message to a manager or another user.',
    parameters: {
      type: 'object',
      properties: {
        recipient_id: { type: 'string', description: 'ID of the recipient' },
        subject: { type: 'string', description: 'Message subject' },
        content: { type: 'string', description: 'Message body' },
      },
      required: ['recipient_id', 'subject', 'content'],
    },
  },
  {
    name: 'log_game',
    description: 'Add an independent game to the referee\'s game log.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Game date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Game time in HH:MM format' },
        location: { type: 'string', description: 'Venue/location' },
        organization: { type: 'string', description: 'League/organization name' },
        fee: { type: 'number', description: 'Game fee in dollars' },
        game_type: { type: 'string', description: 'Type: basketball, football, etc.' },
      },
      required: ['date', 'location'],
    },
  },
];

// ── Context Builder ──────────────────────────────────────────────────────────

import type { MappedAvailability, MappedPayment, IndependentGame } from '@/lib/types';

const buildRefereeSystemPrompt = (
  games: MappedGame[],
  availability: MappedAvailability[],
  payments: MappedPayment[],
  independentGames: IndependentGame[],
  managerProfiles: MappedProfile[],
  userId: string,
  userName: string,
): string => {
  const today = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  const myGames = games
    .filter(g => g.assignments.some(a => a.referee?.id === userId))
    .slice(0, 15)
    .map(g => `  - ${g.homeTeam} vs ${g.awayTeam} on ${g.date} at ${g.time} @ ${g.venue} (${g.status}, $${g.payment}, tournament: "${g.tournamentName}")`)
    .join('\n') || '  (no assigned games)';

  const availDates = availability
    .slice(0, 20)
    .map(a => {
      const start = a.start_time ? new Date(a.start_time).toISOString().slice(0, 10) : 'unknown';
      return `  - ${start}`;
    })
    .join('\n') || '  (no availability logged)';

  const totalEarnings = payments
    .filter(p => p.status === 'paid')
    .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

  const gamesOfficiated = independentGames.length + games.filter(g =>
    g.status === 'completed' && g.assignments.some(a => a.referee?.id === userId)
  ).length;

  const managers = managerProfiles
    .slice(0, 10)
    .map(m => `  - ${m.name} (ID: ${m.id})`)
    .join('\n') || '  (none)';

  return `You are the iWhistle AI Referee Assistant for ${userName}.
Today is ${dayOfWeek}, ${today}.

You help referees check their schedule, manage availability, track earnings, and communicate with managers.

CURRENT DATA:
My Assigned Games:
${myGames}

My Availability Dates:
${availDates}

Stats:
  - Total earnings: $${totalEarnings}
  - Games officiated: ${gamesOfficiated}
  - Independent games logged: ${independentGames.length}

Managers I can message:
${managers}

RULES:
- When I say "this Saturday", "next Friday", etc., calculate the actual date from today (${today}, ${dayOfWeek}).
- For availability, add the dates to my calendar.
- For earnings queries, calculate from the data above.
- For schedule queries, filter my assigned games by the requested time range.
- Be concise, friendly, and helpful.
- If you need more information, ask.`;
};

// ── Model Initialization ─────────────────────────────────────────────────────

let refereeModel: GenerativeModel | null = null;

const getRefereeModel = (): GenerativeModel => {
  if (!refereeModel) {
    const ai = getAI(app, { backend: new VertexAIBackend() });
    refereeModel = getGenerativeModel(ai, {
      model: 'gemini-2.5-pro',
      tools: [{ functionDeclarations: refereeFunctionDeclarations }],
    });
  }
  return refereeModel;
};

// ── Chat Function ────────────────────────────────────────────────────────────

export const sendRefereeMessage = async (
  userMessage: string,
  chatHistory: ChatMessage[],
  context: {
    games: MappedGame[];
    availability: MappedAvailability[];
    payments: MappedPayment[];
    independentGames: IndependentGame[];
    managerProfiles: MappedProfile[];
    userId: string;
    userName: string;
  },
): Promise<AIResponse> => {
  const gemini = getRefereeModel();
  const systemPrompt = buildRefereeSystemPrompt(
    context.games, context.availability, context.payments,
    context.independentGames, context.managerProfiles,
    context.userId, context.userName,
  );

  const contents = [
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    { role: 'model' as const, parts: [{ text: `Hi ${context.userName}! I'm your AI Referee Assistant. I can check your schedule, manage availability, track earnings, and help you message managers. What do you need?` }] },
    ...chatHistory
      .filter(m => m.text)
      .map(m => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }],
      })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const result = await traceAsync('referee_ai_response', () => gemini.generateContent({ contents }));
  const response = result.response;
  const candidate = response.candidates?.[0];

  if (!candidate) {
    return { text: 'Sorry, I couldn\'t process that. Please try again.', actions: [] };
  }

  const actions: AIAction[] = [];
  const textParts: string[] = [];

  for (const part of candidate.content.parts) {
    if ('text' in part && part.text) textParts.push(part.text);
    if ('functionCall' in part && part.functionCall) {
      const fc = part.functionCall;
      const action = parseRefereeFunctionCall(fc.name, fc.args as Record<string, unknown>);
      if (action) actions.push(...action);
    }
  }

  const text = textParts.join('\n').trim() || (actions.length > 0
    ? `I'll handle ${actions.length} action${actions.length > 1 ? 's' : ''} for you. Please review and confirm.`
    : 'I\'m not sure how to help with that. Could you rephrase?');

  return { text, actions };
};

// ── Function Call Parser ─────────────────────────────────────────────────────

const parseRefereeFunctionCall = (name: string, args: Record<string, unknown>): AIAction[] | null => {
  switch (name) {
    case 'query_schedule':
      return [{
        name: 'query_schedule',
        displayName: 'View Schedule',
        args,
        summary: `Check schedule for ${args.time_range}${args.include_past ? ' (including past)' : ''}`,
      }];
    case 'check_availability':
      return [{
        name: 'check_availability',
        displayName: 'Check Availability',
        args,
        summary: `Check if available on ${args.date}`,
      }];
    case 'set_availability':
      return (args.dates as string[]).map(d => ({
        name: 'set_availability',
        displayName: 'Set Available',
        args: { date: d },
        summary: `Mark available on ${d}`,
      }));
    case 'query_earnings':
      return [{
        name: 'query_earnings',
        displayName: 'Check Earnings',
        args,
        summary: `View earnings for ${args.period}`,
      }];
    case 'send_message':
      return [{
        name: 'send_message',
        displayName: 'Send Message',
        args,
        summary: `Send "${args.subject}" to recipient`,
      }];
    case 'log_game':
      return [{
        name: 'log_game',
        displayName: 'Log Game',
        args,
        summary: `Log game on ${args.date} at ${args.location}${args.fee ? ` ($${args.fee})` : ''}`,
      }];
    default:
      return null;
  }
};
