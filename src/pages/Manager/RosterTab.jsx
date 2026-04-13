import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  UserCheck, UserX, Clock, CheckCircle2, Users, Star,
  Trophy, Shield, Phone, Mail, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RefereeProfileCard = ({ referee, connection, isDark }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      className={`rounded-2xl border p-5 transition-all duration-200 ${
        isDark ? 'border-white/10 bg-[#002849]' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-4">
        <img
          src={referee.avatarUrl}
          alt={referee.name}
          className="h-12 w-12 rounded-xl object-cover shrink-0 ring-2 ring-white shadow-xs"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className={`font-bold text-sm ${isDark ? 'text-blue-100' : 'text-slate-900'}`}>
              {referee.name}
            </h4>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className={`text-xs font-semibold ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>
                {referee.rating}
              </span>
            </div>
          </div>
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs ${isDark ? 'text-blue-300/60' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3" /> {referee.gamesOfficiated} games
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> {referee.experience}
            </span>
          </div>
          {referee.certifications?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {referee.certifications.slice(0, 2).map(cert => (
                <span key={cert} className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                  isDark ? 'bg-white/5 border-white/10 text-blue-200' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  {cert}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expand for contact */}
      <button
        className={`mt-3 w-full flex items-center justify-between text-xs font-semibold py-1 ${isDark ? 'text-blue-300/60 hover:text-blue-200' : 'text-slate-400 hover:text-slate-600'} transition-colors`}
        onClick={() => setExpanded(e => !e)}
      >
        Contact info {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`text-xs space-y-1.5 mt-1 pt-2 border-t overflow-hidden ${isDark ? 'border-white/10 text-blue-200' : 'border-slate-100 text-slate-600'}`}
          >
            {referee.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 shrink-0" />
                {referee.phone}
              </div>
            )}
            {referee.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 shrink-0" />
                {referee.email}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const RequestCard = ({ request, referee, onAccept, onDecline, isDark }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className={`rounded-2xl border p-5 transition-all duration-200 ${
      isDark ? 'border-amber-500/20 bg-amber-900/10' : 'border-amber-200 bg-amber-50/60'
    }`}
  >
    <div className="flex items-start gap-4">
      <img
        src={referee?.avatarUrl}
        alt={referee?.name}
        className="h-12 w-12 rounded-xl object-cover shrink-0 ring-2 ring-white shadow-xs"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={`font-bold text-sm ${isDark ? 'text-amber-200' : 'text-slate-900'}`}>
            {referee?.name}
          </h4>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
            isDark ? 'bg-amber-900/30 border-amber-500/30 text-amber-300' : 'bg-amber-100 border-amber-200 text-amber-700'
          }`}>
            <Clock className="h-3 w-3 inline mr-1" />
            Pending
          </span>
        </div>
        <div className={`flex items-center gap-3 mt-0.5 text-xs ${isDark ? 'text-blue-300/60' : 'text-slate-500'}`}>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {referee?.rating}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" /> {referee?.experience}
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="h-3 w-3" /> {referee?.gamesOfficiated} games
          </span>
        </div>
        {request.note && (
          <div className={`mt-3 rounded-lg p-3 text-xs leading-relaxed italic border ${
            isDark ? 'bg-white/5 border-white/10 text-blue-200' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            &ldquo;{request.note}&rdquo;
          </div>
        )}
      </div>
    </div>
    <div className="flex gap-2 mt-4">
      <Button
        data-testid={`accept-request-${request.id}`}
        className="flex-1 gap-2 font-bold text-white"
        style={{ backgroundColor: '#0080C8' }}
        onClick={() => onAccept(request.id)}
      >
        <UserCheck className="h-4 w-4" /> Accept
      </Button>
      <Button
        data-testid={`decline-request-${request.id}`}
        variant="outline"
        className={`flex-1 gap-2 font-semibold ${
          isDark ? 'border-white/10 text-red-300 hover:bg-red-900/20' : 'border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200'
        }`}
        onClick={() => onDecline(request.id)}
      >
        <UserX className="h-4 w-4" /> Decline
      </Button>
    </div>
  </motion.div>
);

const RosterTab = ({ connections, referees, respondToConnection }) => {
  const { isDark } = useTheme();

  const pending   = connections.filter(c => c.status === 'pending');
  const connected = connections.filter(c => c.status === 'connected');

  const getRef = (refereeId) => referees.find(r => r.id === refereeId);

  return (
    <div className="mt-6 space-y-8" data-testid="roster-tab">
      {/* Pending requests */}
      <section data-testid="pending-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-blue-100' : 'text-slate-800'}`}>
            <Clock className="h-5 w-5 text-amber-500" />
            Incoming Requests
            {pending.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: '#FF8C00' }}>
                {pending.length}
              </span>
            )}
          </h2>
        </div>
        {pending.length === 0 ? (
          <div className={`rounded-2xl border py-12 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-25" />
            <p className={`font-semibold ${isDark ? 'text-blue-200' : 'text-slate-500'}`}>No pending requests</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-blue-300/40' : 'text-slate-400'}`}>
              Referees who request to join your roster will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {pending.map(req => (
                <RequestCard
                  key={req.id}
                  request={req}
                  referee={getRef(req.refereeId)}
                  onAccept={(id) => respondToConnection(id, 'connected')}
                  onDecline={(id) => respondToConnection(id, 'declined')}
                  isDark={isDark}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Connected roster */}
      <section data-testid="connected-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-blue-100' : 'text-slate-800'}`}>
            <Users className="h-5 w-5" style={{ color: '#0080C8' }} />
            My Referee Roster
            <span className={`text-sm font-normal ml-1 ${isDark ? 'text-blue-300/50' : 'text-slate-400'}`}>
              ({connected.length} referees)
            </span>
          </h2>
        </div>
        {connected.length === 0 ? (
          <div className={`rounded-2xl border py-12 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            <Users className="h-10 w-10 mx-auto mb-3 opacity-25" />
            <p className={`font-semibold ${isDark ? 'text-blue-200' : 'text-slate-500'}`}>Your roster is empty</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-blue-300/40' : 'text-slate-400'}`}>
              Accept referee requests to build your roster
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {connected.map(conn => {
                const ref = getRef(conn.refereeId);
                if (!ref) return null;
                return (
                  <RefereeProfileCard
                    key={conn.id}
                    referee={ref}
                    connection={conn}
                    isDark={isDark}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
};

export default RosterTab;
