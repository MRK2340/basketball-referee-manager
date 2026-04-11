import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, MessageSquare, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const RefereeManagementTab = ({ referees }) => {
  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `The ${feature} feature is under development. You can request it in a future prompt!`,
    });
  };

  return (
    <Card className="glass-effect border-slate-200 shadow-sm" data-testid="manager-referees-card">
      <CardHeader>
        <CardTitle className="text-slate-900">Referee Management</CardTitle>
        <CardDescription className="text-slate-600">View and manage all registered referees.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-slate-900">Referee</TableHead>
              <TableHead className="text-slate-900">Contact</TableHead>
              <TableHead className="text-center text-slate-900">Rating</TableHead>
              <TableHead className="text-center text-slate-900">Games</TableHead>
              <TableHead className="text-right text-slate-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referees.map((referee) => (
              <TableRow key={referee.id} className="border-slate-100 hover:bg-slate-50/80" data-testid={`manager-referee-row-${referee.id}`}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={referee.avatarUrl} alt={referee.name} />
                      <AvatarFallback>{referee.name ? referee.name.charAt(0) : 'R'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{referee.name}</p>
                      <p className="text-sm text-slate-500">{referee.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-700">{referee.phone || 'N/A'}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center text-slate-700">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {referee.rating?.toFixed(1) || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="text-center text-slate-700">{referee.gamesOfficiated || 0}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" data-testid={`manager-view-referee-${referee.id}`} onClick={() => handleFeatureClick('view-profile')}>
                    <Users className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" data-testid={`manager-message-referee-${referee.id}`} onClick={() => handleFeatureClick('send-message')}>
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefereeManagementTab;