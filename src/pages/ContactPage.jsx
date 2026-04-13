import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast"
import { FaTwitter, FaFacebook, FaInstagram } from 'react-icons/fa';

const ContactPage = () => {
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      description: "You can reach out to us directly via email or our social media channels for now!",
    });
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - iWhistle</title>
        <meta name="description" content="Get in touch with the iWhistle team for support, feedback, or inquiries." />
      </Helmet>
      <div className="min-h-screen text-white animated-background">
        <header className="container mx-auto px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-black/20 sticky top-0 z-50">
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

        <main className="container mx-auto px-6 py-16">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
              Get In Touch
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
              Have a question, feedback, or a partnership inquiry? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="mt-16 max-w-4xl mx-auto p-8 glass-effect rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                  <Input id="name" placeholder="John Doe" className="bg-slate-900/50 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input id="email" type="email" placeholder="john.doe@example.com" className="bg-slate-900/50 border-slate-700" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-slate-300">Subject</Label>
                <Input id="subject" placeholder="e.g., Support Request" className="bg-slate-900/50 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-300">Message</Label>
                <Textarea id="message" placeholder="Your message here..." className="bg-slate-900/50 border-slate-700 min-h-[150px]" />
              </div>
              <div className="text-right">
                <Button type="submit" className="basketball-gradient hover:opacity-90 px-8">
                  Send Message
                </Button>
              </div>
            </form>
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
                    <li><Link to="/about" className="text-slate-400 hover:text-brand-orange transition-colors">About</Link></li>
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

export default ContactPage;