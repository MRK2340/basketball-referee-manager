import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Search } from 'lucide-react';

const NoGamesFound = ({ userRole, hasFilter, onScheduleGame }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass-effect border-slate-200 shadow-sm">
        <CardContent className="p-12 text-center">
          {hasFilter ? (
            <Search className="h-14 w-14 text-slate-300 mx-auto mb-4" />
          ) : (
            <CalendarIcon className="h-14 w-14 text-slate-300 mx-auto mb-4" />
          )}
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {hasFilter ? 'No Matches Found' : 'No Games Found'}
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            {hasFilter
              ? 'Try adjusting your search or filter criteria to find available games.'
              : userRole === 'referee'
              ? "You don't have any games assigned yet. Check Open Games to find available slots."
              : 'No games are currently scheduled. Create one to get started.'}
          </p>
          {userRole === 'manager' && !hasFilter && (
            <Button
              className="basketball-gradient hover:opacity-90 text-white"
              onClick={onScheduleGame}
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Your First Game
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NoGamesFound;