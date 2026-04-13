import React from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | iWhistle</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100"
          >
            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange drop-shadow-sm">
              404
            </h1>
            <h2 className="text-3xl font-bold text-slate-900 mt-6 mb-3">Out of Bounds!</h2>
            <p className="text-slate-600 mb-8 text-lg font-medium">
              The page you're looking for doesn't exist or has been moved to another court.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button asChild className="w-full sm:w-auto basketball-gradient text-white font-bold hover:scale-105 transition-transform shadow-md">
                <Link to="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white font-bold transition-colors">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back Home
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default NotFound;