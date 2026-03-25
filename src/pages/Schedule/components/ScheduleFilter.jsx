import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const ScheduleFilter = ({ searchTerm, setSearchTerm, filter, setFilter }) => {
  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass-effect border-slate-600">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search teams, venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
              {filterOptions.map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(filterOption.key)}
                  className={`flex-shrink-0 ${filter === filterOption.key 
                    ? 'basketball-gradient hover:opacity-90' 
                    : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScheduleFilter;