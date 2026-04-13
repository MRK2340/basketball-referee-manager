import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Users, Target, Zap } from 'lucide-react';
import { FaTwitter, FaFacebook, FaInstagram } from 'react-icons/fa';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us - iWhistle</title>
        <meta name="description" content="Learn about the mission and vision behind iWhistle, the leading platform for basketball officiating." />
      </Helmet>
      <div className="min-h-screen text-white animated-background">
        <header className="container mx-auto px-6 py-4 flex justify-between items-center backdrop-blur-xs bg-black/20 sticky top-0 z-50">
          <Link to="/" className="text-2xl font-bold flex items-center">
            <div className="w-8 h-8 mr-2">
              <img  alt="iWhistle logo" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 5px rgba(255,107,53,0.7))' }} src="https://images.unsplash.com/photo-1633335380138-a64bcef84efe" />
            </div>
            <span className="bg-clip-text text-transparent basketball-gradient" style={{ textShadow: '0 2px 5px rgba(247, 147, 30, 0.4)' }}>iWhistle</span>
          </Link>
          <div>
            <Link to="/login">
              <Button variant="outline" className="mr-2 border-slate-600 text-slate-300 hover:bg-slate-800 bg-slate-900/50">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="basketball-gradient hover:opacity-90">Get Started</Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
              We're Passionate About the Game
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
              iWhistle was born from a simple idea: to make life easier for the unsung heroes of the court—the referees—and the dedicated managers who keep leagues running.
            </p>
          </motion.div>

          <div className="py-20 grid md:grid-cols-3 gap-12 text-left">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="p-8 glass-effect rounded-xl h-full">
                <div className="flex items-center justify-center h-16 w-16 rounded-full basketball-gradient mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Our Mission</h2>
                <p className="text-slate-300">To empower basketball officials and league organizers with powerful, intuitive technology that streamlines every aspect of game management, from scheduling to payment.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}>
              <div className="p-8 glass-effect rounded-xl h-full">
                <div className="flex items-center justify-center h-16 w-16 rounded-full basketball-gradient mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Our Vision</h2>
                <p className="text-slate-300">To be the global standard for sports officiating management, fostering a connected and professional community where everyone can focus on their love for the game.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }}>
              <div className="p-8 glass-effect rounded-xl h-full">
                <div className="flex items-center justify-center h-16 w-16 rounded-full basketball-gradient mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Our Team</h2>
                <p className="text-slate-300">We are a diverse team of former referees, league managers, developers, and designers who share a deep passion for basketball and technology.</p>
              </div>
            </motion.div>
          </div>
        </main>

        <footer className="text-center py-12 mt-16 border-t border-slate-800/50 glass-effect">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-left">
                  <h4 className="font-bold text-lg mb-4 text-white">iWhistle</h4>
                  <p className="text-slate-400">The ultimate platform for connecting referees and league managers.</p>
                </div>
                <div className="text-left md:text-center">
                  <h4 className="font-bold text-lg mb-4 text-white">Quick Links</h4>
                  <ul className="space-y-2">
                    <li><Link to="/" className="text-slate-400 hover:text-brand-orange transition-colors">Home</Link></li>
                    <li><Link to="/contact" className="text-slate-400 hover:text-brand-orange transition-colors">Contact</Link></li>
                    <li><Link to="/#faq" className="text-slate-400 hover:text-brand-orange transition-colors">FAQ</Link></li>
                  </ul>
                </div>
                <div className="text-left md:text-right">
                  <h4 className="font-bold text-lg mb-4 text-white">Follow Us</h4>
                  <div className="flex space-x-4 md:justify-end">
                    {/* Audit Fix: Updated broken # links to valid URL structures */}
                    <a href="https://twitter.com/basketballreff" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors"><FaTwitter size={24} /></a>
                    <a href="https://facebook.com/basketballreff" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors"><FaFacebook size={24} /></a>
                    <a href="https://instagram.com/basketballreff" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors"><FaInstagram size={24} /></a>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-700/50 mt-8 pt-8">
                <p className="text-slate-500">&copy; {new Date().getFullYear()} iWhistle. All rights reserved. The court is yours.</p>
              </div>
            </div>
          </footer>
      </div>
    </>
  );
};

export default AboutPage;