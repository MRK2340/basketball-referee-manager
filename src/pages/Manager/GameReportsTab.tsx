import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, FileText, CheckCircle, AlertTriangle, Trophy, MessageSquare } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const ReportDetailsDialog = ({ open, setOpen, report, onResolve }) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  if (!report) return null;

  const handleResolve = () => {
    onResolve(report.id, resolutionNote);
    setShowResolveForm(false);
    setResolutionNote('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900" data-testid="report-details-dialog">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-blue" />
            <DialogTitle className="text-slate-900 text-xl">Game Report</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            {report.gameTitle} — Submitted by {report.refereeName}
            {report.createdAt && ` on ${format(new Date(report.createdAt), 'PPP')}`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Final Score */}
          <div className="p-4 bg-linear-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Final Score</p>
            <p className="text-2xl font-black text-slate-900">
              {report.homeScore} – {report.awayScore}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {report.technicalFouls !== null && report.technicalFouls !== undefined && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <AlertTriangle className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-orange-700">{report.technicalFouls}</p>
                <p className="text-xs text-orange-600 font-medium">Tech Fouls</p>
              </div>
            )}
            {report.ejections !== null && report.ejections !== undefined && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                <Trophy className="h-4 w-4 text-red-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-red-700">{report.ejections}</p>
                <p className="text-xs text-red-600 font-medium">Ejections</p>
              </div>
            )}
            {report.personalFouls !== null && report.personalFouls !== undefined && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-lg font-bold text-slate-700">{report.personalFouls}</p>
                <p className="text-xs text-slate-500 font-medium">Personal Fouls</p>
              </div>
            )}
          </div>

          {/* Professionalism */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-800">Coach & Player Professionalism</p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`h-5 w-5 ${report.professionalismRating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
              ))}
              <span className="text-sm text-slate-600 ml-1">{report.professionalismRating}/5</span>
            </div>
          </div>

          {/* MVP */}
          {report.mvpPlayer && (
            <div>
              <p className="text-sm font-bold text-slate-800 mb-1">Game MVP</p>
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-slate-800 text-sm font-semibold">{report.mvpPlayer}</span>
              </div>
            </div>
          )}

          {/* Incidents */}
          <div>
            <p className="text-sm font-bold text-slate-800 mb-1">Incidents or Issues</p>
            <p className="text-slate-700 bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm">
              {report.incidents || 'None reported.'}
            </p>
          </div>

          {/* Notes */}
          <div>
            <p className="text-sm font-bold text-slate-800 mb-1">General Notes</p>
            <p className="text-slate-700 bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm">
              {report.notes || 'No additional notes.'}
            </p>
          </div>

          {/* Resolution Note */}
          {report.resolutionNote && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-bold text-green-800">Manager Resolution Note</p>
              </div>
              <p className="text-green-700 text-sm">{report.resolutionNote}</p>
              {report.resolvedAt && (
                <p className="text-xs text-green-600">{format(new Date(report.resolvedAt), 'PPP')}</p>
              )}
            </div>
          )}

          {/* Add Resolution Form */}
          {!report.resolutionNote && (
            showResolveForm ? (
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <Label className="text-slate-800 font-bold text-sm">Add Resolution Note</Label>
                <Textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe how this was resolved..."
                  className="bg-white border-slate-300 text-slate-900 text-sm"
                  data-testid="report-resolution-input"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleResolve} className="bg-green-600 hover:bg-green-700 text-white" data-testid="report-resolve-submit-button">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Submit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowResolveForm(false)} className="text-slate-500">Cancel</Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResolveForm(true)}
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
                data-testid="report-add-resolution-button"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Add Resolution Note
              </Button>
            )
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-300 text-slate-700" data-testid="report-details-close-button">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GameReportsTab = ({ gameReports }) => {
  const { reportActions } = useData();
  const { addReportResolution } = reportActions;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const handleResolve = (reportId, note) => {
    addReportResolution(reportId, note);
    // Update selected report to show resolution immediately
    setSelectedReport((prev) => prev ? { ...prev, resolutionNote: note, resolvedAt: new Date().toISOString() } : prev);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Submitted</Badge>;
      case 'reviewed':
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Reviewed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  if (gameReports.length === 0) {
    return (
      <Card className="glass-effect border-slate-200 shadow-xs mt-4" data-testid="manager-game-reports-card">
        <CardContent className="p-12 text-center">
          <FileText className="h-14 w-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Reports Yet</h3>
          <p className="text-slate-500 text-sm">Game reports submitted by referees will appear here once games are completed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-effect border-slate-200 shadow-xs mt-4" data-testid="manager-game-reports-card">
        <CardHeader>
          <CardTitle className="text-slate-900">Game Reports</CardTitle>
          <CardDescription className="text-slate-600">Review and resolve post-game reports submitted by referees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-slate-900 font-bold">Game</TableHead>
                  <TableHead className="text-slate-900 font-bold">Referee</TableHead>
                  <TableHead className="text-slate-900 font-bold">Score</TableHead>
                  <TableHead className="text-slate-900 font-bold">Date Submitted</TableHead>
                  <TableHead className="text-center text-slate-900 font-bold">Status</TableHead>
                  <TableHead className="text-right text-slate-900 font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gameReports.map((report) => (
                  <TableRow key={report.id} className="border-slate-100 hover:bg-slate-50/80" data-testid={`manager-report-row-${report.id}`}>
                    <TableCell className="font-semibold text-slate-900">{report.gameTitle}</TableCell>
                    <TableCell className="text-slate-700">{report.refereeName}</TableCell>
                    <TableCell className="text-slate-700 font-bold">
                      {report.homeScore !== undefined ? `${report.homeScore} – ${report.awayScore}` : '—'}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {report.createdAt ? format(new Date(report.createdAt), 'MMM dd, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`manager-view-report-${report.id}`}
                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        onClick={() => handleViewDetails(report)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <ReportDetailsDialog
        open={detailsOpen}
        setOpen={setDetailsOpen}
        report={selectedReport}
        onResolve={handleResolve}
      />
    </>
  );
};

export default GameReportsTab;
