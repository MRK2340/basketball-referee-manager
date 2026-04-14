import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { sendAssistantMessage, type ChatMessage, type AIAction } from '@/lib/aiAssistant';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import {
  Bot, X, Send, Loader2, CheckCircle2, Trophy, Calendar, UserCheck,
  Pencil, Trash2, ClipboardCheck, Sparkles, AlertCircle,
} from 'lucide-react';

const ACTION_ICONS: Record<string, typeof Trophy> = {
  create_game: Calendar,
  create_tournament: Trophy,
  assign_referee: UserCheck,
  update_game: Pencil,
  cancel_game: Trash2,
  complete_game: ClipboardCheck,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export const AIAssistantPanel = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const {
    tournaments, games, referees,
    gameActions, tournamentActions, assignmentActions,
  } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi! I\'m your AI Manager Assistant. Tell me what you need — schedule games, create tournaments, assign referees, or anything else. Just type in plain English.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [executingActions, setExecutingActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendAssistantMessage(
        text,
        messages,
        { tournaments, games, referees },
      );

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: response.text,
        actions: response.actions.length > 0 ? response.actions : undefined,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = (err as Error).message || 'Something went wrong';
      let displayError = errorMsg;
      if (errorMsg.includes('Vertex AI')) {
        displayError = 'Vertex AI is not enabled for this project. Please enable the Vertex AI API in your Firebase Console (Build → AI Logic → Get Started).';
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: displayError,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, tournaments, games, referees]);

  const executeActions = useCallback(async (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg.actions || msg.actionsExecuted) return;

    setExecutingActions(true);
    let successCount = 0;
    let errorCount = 0;

    for (const action of msg.actions) {
      try {
        switch (action.name) {
          case 'create_game': {
            const a = action.args;
            await gameActions.addGame({
              tournament_id: a.tournament_id,
              home_team: a.home_team || 'TBD',
              away_team: a.away_team || 'TBD',
              game_date: a.game_date,
              game_time: a.game_time,
              venue: a.venue,
              division: a.division || '',
              level: a.level || 'Varsity',
              payment_amount: Number(a.payment_amount) || 75,
              required_certifications: [],
              status: 'scheduled',
            });
            successCount++;
            break;
          }
          case 'create_tournament': {
            const a = action.args;
            await tournamentActions.addTournament({
              name: a.name,
              location: a.location,
              startDate: a.start_date,
              endDate: a.end_date,
              numberOfCourts: Number(a.number_of_courts) || 1,
            });
            successCount++;
            break;
          }
          case 'assign_referee': {
            const a = action.args;
            await assignmentActions.assignRefereeToGame(a.game_id as string, a.referee_id as string);
            successCount++;
            break;
          }
          case 'complete_game': {
            const a = action.args;
            await gameActions.markGameAsCompleted(a.game_id as string);
            successCount++;
            break;
          }
          default:
            errorCount++;
            break;
        }
      } catch {
        errorCount++;
      }
    }

    // Mark actions as executed
    setMessages(prev => prev.map((m, i) =>
      i === msgIndex ? { ...m, actionsExecuted: true } : m
    ));

    // Add result message
    const resultText = errorCount === 0
      ? `Done! ${successCount} action${successCount !== 1 ? 's' : ''} completed successfully.`
      : `${successCount} succeeded, ${errorCount} failed. Check the dashboard for details.`;

    setMessages(prev => [...prev, {
      role: 'assistant',
      text: resultText,
      timestamp: Date.now(),
    }]);

    setExecutingActions(false);
    toast({ title: 'Actions Executed', description: resultText });
  }, [messages, gameActions, tournamentActions, assignmentActions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
            data-testid="ai-assistant-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-linear-to-r from-[#003D7A] to-[#0080C8]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">AI Assistant</h3>
                  <p className="text-blue-200 text-xs">Gemini 2.5 Pro</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10"
                data-testid="ai-assistant-close-btn"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`ai-msg-${i}`}
                  >
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Bot className="h-3.5 w-3.5 text-brand-blue" />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Assistant</span>
                        </div>
                      )}

                      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0080C8] text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-800 rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>

                      {/* Action Cards */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.actions.map((action, ai) => {
                            const Icon = ACTION_ICONS[action.name] || Calendar;
                            return (
                              <Card key={ai} className={`border-slate-200 shadow-none ${msg.actionsExecuted ? 'opacity-60' : ''}`} data-testid={`ai-action-card-${i}-${ai}`}>
                                <CardContent className="p-2.5 flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-lg bg-blue-50 shrink-0">
                                    <Icon className="h-3.5 w-3.5 text-brand-blue" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <Badge variant="outline" className="text-[10px] border-slate-200 shrink-0">
                                        {action.displayName}
                                      </Badge>
                                      {msg.actionsExecuted && (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-0.5 truncate">{action.summary}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}

                          {!msg.actionsExecuted && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                className="basketball-gradient text-white hover:opacity-90 gap-1.5 h-8 text-xs flex-1"
                                onClick={() => executeActions(i)}
                                disabled={executingActions}
                                data-testid={`ai-confirm-actions-${i}`}
                              >
                                {executingActions
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <CheckCircle2 className="h-3.5 w-3.5" />}
                                Confirm ({msg.actions.length})
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-200 text-slate-600 h-8 text-xs"
                                onClick={() => setMessages(prev => prev.map((m, idx) =>
                                  idx === i ? { ...m, actionsExecuted: true } : m
                                ))}
                                data-testid={`ai-dismiss-actions-${i}`}
                              >
                                Skip
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
                        <span className="text-sm text-slate-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
                  disabled={loading}
                  data-testid="ai-assistant-input"
                />
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-xl basketball-gradient text-white hover:opacity-90 shrink-0"
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  data-testid="ai-assistant-send-btn"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                Powered by Gemini 2.5 Pro via Firebase AI Logic
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
