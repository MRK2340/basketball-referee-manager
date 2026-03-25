import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

const NoGamesFound = ({ userRole, hasFilter, onScheduleGame }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass-effect border-slate-600">
        <CardContent className="p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Games Found</h3>
          <p className="text-slate-400 mb-6">
            {hasFilter
              ? 'Try adjusting your search or filter criteria.'
              : userRole === 'referee'
              ? 'You have no games assigned. Check back later!'
              : 'No games are currently scheduled.'}
          </p>
          {userRole === 'manager' && !hasFilter && (
            <Button
              className="basketball-gradient hover:opacity-90"
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