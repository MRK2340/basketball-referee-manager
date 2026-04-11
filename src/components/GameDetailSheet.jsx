import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, Clock, MapPin, Trophy, DollarSign, Users, 
  CheckCircle, AlertTriangle, Star, FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const statusConfig = {
  scheduled:    { color: 'bg-blue-100 text-blue-700 border-blue-200',   label: 'Scheduled' },
  'in-progress':{ color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'In Progress' },
  completed:    { color: 'bg-green-100 text-green-700 border-green-200', label: 'Completed' },
};

const assignmentStatus = {
  accepted:  { color: 'bg-green-100 text-green-700',  label: 'Accepted' },
  assigned:  { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  declined:  { color: 'bg-red-100 text-red-700',      label: 'Declined' },
  requested: { color: 'bg-purple-100 text-purple-700', label: 'Requested' },
};

const InfoRow = ({ icon: Icon, label, value, iconColor = 'text-slate-500' }) => (
  <div className="flex items-start gap-3">
    <div className={`mt-0.5 ${iconColor}`}><Icon className="h-4 w-4" /></div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-slate-900 font-semibold text-sm">{value}</p>
    </div>
  </div>
);

const GameDetailSheet = ({ open, setOpen, game, gameReport }) => {
  if (!game) return null;

  const cfg = statusConfig[game.status] || statusConfig.scheduled;
  let formattedDate = game.date;
  try { formattedDate = format(parseISO(game.date), 'EEEE, MMMM d, yyyy'); } catch { /* skip */ }
  let formattedTime = game.time;
  try { formattedTime = format(new Date(`1970-01-01T${game.time}`), 'h:mm a'); } catch { /* skip */ }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-lg bg-white border-slate-200 text-slate-900 overflow-y-auto" data-testid="game-detail-sheet">
        <SheetHeader className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`border text-xs font-bold ${cfg.color}`}>{cfg.label}</Badge>
            {game.division && (
              <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">{game.division}</Badge>
            )}
          </div>
          <SheetTitle className="text-slate-900 text-xl font-black">
            {game.homeTeam} vs {game.awayTeam}
          </SheetTitle>
          <SheetDescription className="text-slate-600">
            {game.tournamentName || 'Independent Game'}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Final Score */}
          {game.status === 'completed' && game.homeScore !== undefined && (
            <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Final Score</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">{game.homeTeam}</p>
                  <p className="text-4xl font-black text-slate-900">{game.homeScore}</p>
                </div>
                <span className="text-2xl font-black text-slate-400">–</span>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">{game.awayTeam}</p>
                  <p className="text-4xl font-black text-slate-900">{game.awayScore}</p>
                </div>
              </div>
            </div>
          )}

          {/* Game Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoRow icon={Calendar} label="Date" value={formattedDate} iconColor="text-brand-blue" />
            <InfoRow icon={Clock} label="Time" value={formattedTime} iconColor="text-brand-orange" />
            <InfoRow icon={MapPin} label="Venue" value={game.venue} iconColor="text-green-600" />
            <InfoRow icon={DollarSign} label="Pay" value={`$${game.payment}`} iconColor="text-green-600" />
            <InfoRow icon={Trophy} label="Level" value={game.level || 'Standard'} iconColor="text-yellow-600" />
            <InfoRow icon={Users} label="Division" value={game.division || 'N/A'} iconColor="text-purple-600" />
          </div>

          {/* Assigned Referees */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Officiating Crew
            </h4>
            <div className="space-y-2">
              {(game.assignments || []).length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
                  <p className="text-slate-500 text-sm">No referees assigned yet</p>
                </div>
              ) : (
                (game.assignments || []).map((a) => {
                  const asCfg = assignmentStatus[a.status] || assignmentStatus.assigned;
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200" data-testid={`sheet-assignment-${a.id}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={a.referee?.avatarUrl} />
                        <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                          {a.referee?.name?.charAt(0) || 'R'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{a.referee?.name || 'Referee'}</p>
                      </div>
                      <Badge className={`text-xs border-0 ${asCfg.color}`}>{asCfg.label}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Required Certs */}
          {(game.requiredCertifications || []).length > 0 && (
            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Required Certifications
              </h4>
              <div className="flex flex-wrap gap-2">
                {(game.requiredCertifications || []).map((cert) => (
                  <Badge key={cert} variant="outline" className="border-slate-300 text-slate-700 text-xs">{cert}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Game Report Summary */}
          {gameReport && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Game Report Summary
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Professionalism</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${(gameReport.professionalismRating||0) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                </div>
                {gameReport.ejections > 0 && (
                  <div>
                    <p className="text-xs text-slate-500">Ejections</p>
                    <p className="font-bold text-red-600">{gameReport.ejections}</p>
                  </div>
                )}
                {gameReport.technicalFouls > 0 && (
                  <div>
                    <p className="text-xs text-slate-500">Tech Fouls</p>
                    <p className="font-bold text-orange-600">{gameReport.technicalFouls}</p>
                  </div>
                )}
                {gameReport.mvpPlayer && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">MVP</p>
                    <p className="font-semibold text-slate-900">{gameReport.mvpPlayer}</p>
                  </div>
                )}
              </div>
              {gameReport.incidents && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Incidents</p>
                  <p className="text-slate-700 text-sm bg-white border border-slate-200 rounded p-2">{gameReport.incidents}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GameDetailSheet;
