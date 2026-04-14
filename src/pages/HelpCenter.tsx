import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, ChevronUp, ArrowLeft, Calendar, Users, DollarSign,
  Shield, Bell, ClipboardList, MessageSquare, Settings, HelpCircle,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: typeof Calendar;
  items: FAQItem[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: 'Getting Started',
    icon: HelpCircle,
    items: [
      { question: 'What is iWhistle?', answer: 'iWhistle is an AAU youth basketball league management platform. Referees can view their schedule, log availability, track earnings, and communicate with managers. Managers can assign referees, create tournaments, manage game schedules, and use AI-powered tools.' },
      { question: 'How do I create an account?', answer: 'Click "Register" on the landing page. Choose your role (Referee or Manager), fill in your details, and verify your email. You can also try the demo accounts to explore the app first.' },
      { question: 'What\'s the difference between a Referee and Manager account?', answer: 'Referees see their assigned games, availability calendar, game log, and earnings. Managers see tournament management, game assignments, referee roster, bracket editor, leaderboards, and the AI Assistant.' },
    ],
  },
  {
    title: 'Schedule & Games',
    icon: Calendar,
    items: [
      { question: 'How do I view my schedule?', answer: 'Go to the Schedule page from the sidebar. You\'ll see all your upcoming assigned games with date, time, venue, and payment details.' },
      { question: 'How do I mark myself as available?', answer: 'Go to the Calendar page, select dates, and click "Mark Available." Managers can see your availability when assigning games.' },
      { question: 'Can I import my schedule from other platforms?', answer: 'Yes! Go to Games > Independent Log > Import Schedule. Upload a CSV, Excel, or PDF export from ArbiterSports, GameOfficials, or Assigning.net. Past games go to your game log, future dates to your availability.' },
      { question: 'How do I decline a game assignment?', answer: 'On the Schedule page, click the game card and select "Decline Assignment." You\'ll be asked to provide a reason.' },
    ],
  },
  {
    title: 'Tournaments & Brackets',
    icon: ClipboardList,
    items: [
      { question: 'How do I create a tournament?', answer: 'Managers can create tournaments from the Manager > Tournaments tab. Click "Add Tournament" and fill in the name, location, dates, and number of courts.' },
      { question: 'How does the bracket editor work?', answer: 'Go to Manager > Brackets tab, select a tournament, and click "Create Bracket." Choose a format (Single Elimination, Double Elimination, or Round Robin), enter team names, and generate. Set scores to advance winners through the bracket.' },
      { question: 'Can I bulk import games?', answer: 'Yes! Managers can use the "Bulk Import Games" button in the Tournaments tab. Upload a CSV or Excel file with game data, and optionally create a new tournament during import.' },
    ],
  },
  {
    title: 'Payments & Earnings',
    icon: DollarSign,
    items: [
      { question: 'How do I track my earnings?', answer: 'Go to the Payments page to see all your game fees. You can filter by status (pending/paid), search, and export your payment history as CSV.' },
      { question: 'How do I log independent game fees?', answer: 'Go to Games > Independent Log > "Log Game." Enter the date, location, organization, and fee. You can also import games from other platforms.' },
    ],
  },
  {
    title: 'AI Assistant',
    icon: MessageSquare,
    items: [
      { question: 'What can the AI Assistant do?', answer: 'Managers: Create games, tournaments, assign referees, update schedules, cancel games — all by typing in plain English. Referees: Check schedule, manage availability, track earnings, send messages, log games.' },
      { question: 'How do I use voice input?', answer: 'Click the microphone button next to the text input in the AI panel. Speak your command, and it will be transcribed in real-time. Works in Chrome, Edge, and Safari.' },
    ],
  },
  {
    title: 'Account & Security',
    icon: Shield,
    items: [
      { question: 'How do I enable two-factor authentication?', answer: 'Go to Settings > Account & Security > Two-Factor Authentication. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.) and enter the verification code.' },
      { question: 'How do I change my password?', answer: 'Go to Settings > Account & Security > Change Password. A password reset link will be sent to your email.' },
      { question: 'How do I export or delete my data?', answer: 'Go to Settings > Account & Security. "Export My Data" downloads all your data as JSON. "Delete Account" permanently removes all your data (GDPR compliant).' },
      { question: 'What are the privacy settings?', answer: 'Go to Settings > Account & Security > Privacy Settings. You can control whether your profile is public, whether your email/rating/availability are visible to others.' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { question: 'How do notifications work?', answer: 'You receive in-app notifications for game assignments, messages, and schedule changes. Click the bell icon in the top bar to view them. Push notifications are sent for game reminders (24h and 1h before).' },
      { question: 'How do I manage notification preferences?', answer: 'Go to Settings > Notifications. Toggle push notifications, email notifications, game reminders, and message alerts on or off.' },
    ],
  },
];

const FAQItemComponent = ({ item }: { item: FAQItem }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 px-1 text-left hover:bg-slate-50/50 transition-colors rounded"
        data-testid={`faq-q-${item.question.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`}
      >
        <span className="text-sm font-medium text-slate-800 pr-4">{item.question}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
          <p className="text-sm text-slate-600 pb-3.5 px-1 leading-relaxed">{item.answer}</p>
        </motion.div>
      )}
    </div>
  );
};

const HelpCenter = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Help Center - iWhistle</title>
        <meta name="description" content="Get help with iWhistle — FAQs, guides, and support for referees and managers." />
      </Helmet>

      <div className="space-y-8 max-w-3xl mx-auto" data-testid="help-center-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-left">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-500 mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Help Center</h1>
          <p className="text-slate-500 mt-1">Find answers to common questions about iWhistle.</p>
        </motion.div>

        <div className="space-y-6">
          {FAQ_SECTIONS.map((section, si) => {
            const Icon = section.icon;
            return (
              <motion.div key={si} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
                <Card className="border-slate-200 shadow-none" data-testid={`faq-section-${si}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-1.5 rounded-lg bg-blue-50">
                        <Icon className="h-4 w-4 text-brand-blue" />
                      </div>
                      <h2 className="font-semibold text-slate-900">{section.title}</h2>
                      <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400">{section.items.length} questions</Badge>
                    </div>
                    <div>
                      {section.items.map((item, ii) => (
                        <FAQItemComponent key={ii} item={item} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-slate-400">Can't find what you're looking for?</p>
          <Button variant="link" onClick={() => navigate('/contact')} className="text-brand-blue">Contact Support</Button>
        </div>
      </div>
    </>
  );
};

export default HelpCenter;
