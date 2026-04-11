import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navigate } from 'react-router-dom';
import {
  MapPin, Star, Trophy, Users, CheckCircle2, Clock, XCircle,
  Search, ChevronRight, Send, Shield, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const statusConfig = {
  connected: { label: 'On Roster', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending:   { label: 'Pending',   icon: Clock,        className: 'bg-amber-100 text-amber-700 border-amber-200' },
  declined:  { label: 'Declined',  icon: XCircle,      className: 'bg-red-100 text-red-700 border-red-200' },
};

const ManagerCard = ({ manager, connection, onRequest, onWithdraw, isDark }) => {
  const status = connection?.status;
  const StatusIcon = status ? statusConfig[status]?.icon : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-md ${
        isDark
          ? 'border-white/10 bg-[#002849] hover:border-white/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <img
          src={manager.avatarUrl}
          alt={manager.name}
          className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow-sm flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className={`text-base font-bold truncate ${isDark ? 'text-blue-100' : 'text-slate-900'}`}>
              {manager.name}
            </h3>
            {status && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig[status].className}`}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig[status].label}
              </span>
            )}
          </div>
          <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-[#4DB8E8]' : 'text-[#0080C8]'}`}>
            {manager.leagueName}
          </p>
          <div className={`flex items-center gap-1 text-xs mt-1 ${isDark ? 'text-blue-300/60' : 'text-slate-500'}`}>
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {manager.location}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className={`text-sm leading-relaxed ${isDark ? 'text-blue-200/70' : 'text-slate-600'}`}>
        {manager.bio}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>
          <Star className="h-4 w-4 text-amber-400 fill-amber-400 flex-shrink-0" />
          <span className="font-semibold">{manager.rating}</span>
          <span className={`text-xs ${isDark ? 'text-blue-300/50' : 'text-slate-400'}`}>rating</span>
        </div>
        <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>
          <Trophy className="h-4 w-4 text-[#FF8C00] flex-shrink-0" />
          <span className="font-semibold">{manager.activeTournaments}</span>
          <span className={`text-xs ${isDark ? 'text-blue-300/50' : 'text-slate-400'}`}>active tournaments</span>
        </div>
        <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>
          <Shield className="h-4 w-4 text-[#0080C8] flex-shrink-0" />
          <span className="font-semibold">{manager.experience}</span>
        </div>
      </div>

      {/* Certifications */}
      {manager.certifications?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {manager.certifications.map(cert => (
            <span
              key={cert}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                isDark ? 'bg-white/5 border-white/10 text-blue-200' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {cert}
            </span>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="pt-1">
        {!status && (
          <Button
            data-testid={`request-join-btn-${manager.id}`}
            className="w-full gap-2 font-bold"
            style={{ backgroundColor: '#0080C8' }}
            onClick={() => onRequest(manager)}
          >
            <Send className="h-4 w-4" />
            Request to Join Roster
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        )}
        {status === 'pending' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50 font-semibold"
              disabled
            >
              <Clock className="h-4 w-4 mr-2" /> Awaiting Response
            </Button>
            <Button
              variant="outline"
              data-testid={`withdraw-btn-${manager.id}`}
              className="border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={() => onWithdraw(manager.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {status === 'connected' && (
          <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${
            isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
          }`}>
            <CheckCircle2 className="h-4 w-4" />
            You&rsquo;re on this roster
          </div>
        )}
        {status === 'declined' && (
          <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${
            isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'
          }`}>
            <XCircle className="h-4 w-4" />
            Request declined
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FindManagersPage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { managerProfiles, connections, connectionActions } = useData();
  const { requestManagerConnection, withdrawConnection } = connectionActions;

  const [search, setSearch] = useState('');
  const [requestTarget, setRequestTarget] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user?.role !== 'referee') return <Navigate to="/dashboard" replace />;

  const filtered = (managerProfiles || []).filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.leagueName?.toLowerCase().includes(search.toLowerCase()) ||
    m.location?.toLowerCase().includes(search.toLowerCase())
  );

  const getConnection = (managerId) => connections?.find(c => c.managerId === managerId);

  const handleRequest = (manager) => {
    setRequestTarget(manager);
    setNote('');
  };

  const handleSubmitRequest = () => {
    if (!requestTarget) return;
    setSubmitting(true);
    requestManagerConnection(requestTarget.id, note);
    setSubmitting(false);
    setRequestTarget(null);
    setNote('');
  };

  const myRosters = filtered.filter(m => getConnection(m.id)?.status === 'connected');
  const pendingMgrs = filtered.filter(m => getConnection(m.id)?.status === 'pending');
  const available  = filtered.filter(m => !getConnection(m.id));
  const declined   = filtered.filter(m => getConnection(m.id)?.status === 'declined');

  return (
    <>
      <Helmet>
        <title>Find Managers - iWhistle</title>
      </Helmet>

      <div className="space-y-8" data-testid="find-managers-page">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="app-kicker mb-3">Referee Portal</p>
          <h1 className="app-heading mb-3 text-4xl" style={{ color: isDark ? '#4DB8E8' : '#0080C8' }}>
            Find Managers
          </h1>
          <p className={`max-w-2xl text-base ${isDark ? 'text-blue-200/70' : 'text-slate-600'}`}>
            Browse league managers, request to join their referee roster, and get assigned to games.
            You can be on multiple rosters simultaneously.
          </p>
        </motion.div>

        {/* Search bar */}
        <div className="relative max-w-lg">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-blue-300/50' : 'text-slate-400'}`} />
          <input
            data-testid="find-managers-search"
            type="text"
            placeholder="Search by name, league, or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 ${
              isDark
                ? 'bg-white/5 border border-white/10 text-blue-100 placeholder-blue-300/40 focus:ring-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-[#0080C8]/20 focus:border-[#0080C8]/40'
            }`}
          />
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'On Roster', count: connections?.filter(c => c.status === 'connected').length || 0, color: 'text-emerald-600' },
            { label: 'Pending', count: connections?.filter(c => c.status === 'pending').length || 0, color: 'text-amber-600' },
            { label: 'Available', count: managerProfiles?.length - (connections?.length || 0), color: isDark ? 'text-blue-300' : 'text-slate-600' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border ${
              isDark ? 'bg-white/5 border-white/10 text-blue-200' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
              {s.label}
            </div>
          ))}
        </div>

        {/* My current rosters */}
        {myRosters.length > 0 && (
          <section data-testid="my-rosters-section">
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-100' : 'text-slate-800'}`}>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              My Current Rosters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myRosters.map(m => (
                <ManagerCard key={m.id} manager={m} connection={getConnection(m.id)} onRequest={handleRequest} onWithdraw={withdrawConnection} isDark={isDark} />
              ))}
            </div>
          </section>
        )}

        {/* Pending requests */}
        {pendingMgrs.length > 0 && (
          <section data-testid="pending-requests-section">
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-100' : 'text-slate-800'}`}>
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Requests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingMgrs.map(m => (
                <ManagerCard key={m.id} manager={m} connection={getConnection(m.id)} onRequest={handleRequest} onWithdraw={withdrawConnection} isDark={isDark} />
              ))}
            </div>
          </section>
        )}

        {/* Available managers */}
        {available.length > 0 && (
          <section data-testid="available-managers-section">
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-100' : 'text-slate-800'}`}>
              <Users className="h-5 w-5" style={{ color: '#0080C8' }} />
              Available Managers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {available.map(m => (
                <ManagerCard key={m.id} manager={m} connection={getConnection(m.id)} onRequest={handleRequest} onWithdraw={withdrawConnection} isDark={isDark} />
              ))}
            </div>
          </section>
        )}

        {/* Declined */}
        {declined.length > 0 && (
          <section>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-100' : 'text-slate-800'}`}>
              <XCircle className="h-5 w-5 text-red-400" />
              Declined Requests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {declined.map(m => (
                <ManagerCard key={m.id} manager={m} connection={getConnection(m.id)} onRequest={handleRequest} onWithdraw={withdrawConnection} isDark={isDark} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className={`text-center py-20 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className={`text-lg font-semibold ${isDark ? 'text-blue-200' : 'text-slate-600'}`}>No managers found</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-blue-300/50' : 'text-slate-400'}`}>Try a different search term</p>
          </div>
        )}
      </div>

      {/* Request dialog */}
      <Dialog open={!!requestTarget} onOpenChange={() => setRequestTarget(null)}>
        <DialogContent className={isDark ? 'bg-[#002849] border-white/10 text-blue-100' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-blue-100' : ''}>
              Request to Join Roster
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-blue-300/70' : ''}>
              Send a request to <strong>{requestTarget?.name}</strong> — {requestTarget?.leagueName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>
              Introduction note (optional)
            </label>
            <Textarea
              data-testid="connection-note-input"
              placeholder="Tell the manager about your experience, certifications, and availability…"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              className={isDark ? 'bg-white/5 border-white/10 text-blue-100 placeholder-blue-300/40' : ''}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRequestTarget(null)} className={isDark ? 'border-white/10 text-blue-200 hover:bg-white/10' : ''}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-request-btn"
              onClick={handleSubmitRequest}
              disabled={submitting}
              className="gap-2 font-bold"
              style={{ backgroundColor: '#0080C8' }}
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Sending…' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FindManagersPage;
