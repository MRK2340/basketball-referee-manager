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
    <Card className="glass-effect border-slate-600">
      <CardHeader>
        <CardTitle className="text-white">Referee Management</CardTitle>
        <CardDescription className="text-slate-400">View and manage all registered referees.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-800/50">
              <TableHead className="text-white">Referee</TableHead>
              <TableHead className="text-white">Contact</TableHead>
              <TableHead className="text-white text-center">Rating</TableHead>
              <TableHead className="text-white text-center">Games</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referees.map((referee) => (
              <TableRow key={referee.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={referee.avatar_url} alt={referee.name} />
                      <AvatarFallback>{referee.name ? referee.name.charAt(0) : 'R'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{referee.name}</p>
                      <p className="text-sm text-slate-400">{referee.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-300">{referee.phone || 'N/A'}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center text-slate-300">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {referee.rating?.toFixed(1) || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="text-center text-slate-300">{referee.games_officiated || 0}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleFeatureClick('view-profile')}>
                    <Users className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleFeatureClick('send-message')}>
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RefereeManagementTab;