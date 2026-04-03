import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star } from 'lucide-react';

const ReportDetailsDialog = ({ open, setOpen, report }) => {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Game Report: {report.gameTitle}</DialogTitle>
          <DialogDescription>
            Submitted by {report.refereeName} on {format(new Date(report.createdAt), 'PPP')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-slate-800/50 rounded-lg text-center">
            <p className="text-white font-semibold text-lg">
              Final Score: {report.homeScore} - {report.awayScore}
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Professionalism Rating</p>
              <div className="flex items-center space-x-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`h-5 w-5 ${report.professionalismRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold">Incidents or Issues</p>
              <p className="text-slate-300 bg-slate-800/50 p-2 rounded-md mt-1">{report.incidents || 'None reported.'}</p>
            </div>
            <div>
              <p className="font-semibold">General Notes</p>
              <p className="text-slate-300 bg-slate-800/50 p-2 rounded-md mt-1">{report.notes || 'None.'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GameReportsTab = ({ gameReports }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>;
      case 'reviewed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Reviewed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="glass-effect border-slate-200 shadow-sm" data-testid="manager-game-reports-card">
        <CardHeader>
          <CardTitle className="text-slate-900">Game Reports</CardTitle>
          <CardDescription className="text-slate-600">Review post-game reports submitted by referees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-slate-900">Game</TableHead>
                <TableHead className="text-slate-900">Referee</TableHead>
                <TableHead className="text-slate-900">Date Submitted</TableHead>
                <TableHead className="text-center text-slate-900">Status</TableHead>
                <TableHead className="text-right text-slate-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameReports.map((report) => (
                <TableRow key={report.id} className="border-slate-100 hover:bg-slate-50/80" data-testid={`manager-report-row-${report.id}`}>
                  <TableCell className="font-medium text-slate-900">{report.gameTitle}</TableCell>
                  <TableCell className="text-slate-700">{report.refereeName}</TableCell>
                  <TableCell className="text-slate-700">{format(new Date(report.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" data-testid={`manager-view-report-${report.id}`} className="border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => handleViewDetails(report)}>
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
      <ReportDetailsDialog open={detailsOpen} setOpen={setDetailsOpen} report={selectedReport} />
    </>
  );
};

export default GameReportsTab;