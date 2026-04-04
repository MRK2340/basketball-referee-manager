import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Users, BarChart2, Star, UserCheck, CalendarDays, DollarSign, MessageSquare, FileText, ClipboardList } from 'lucide-react';
import { FaTwitter, FaFacebook, FaInstagram } from 'react-icons/fa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FeatureCard = ({ icon, label, title, description, delay }) => (
  <motion.div
    className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-slate-50 border border-slate-100 shadow-sm shrink-0">
          {icon}
        </div>
        {label && (
            <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Core Feature</span>
                <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md inline-block w-max">{label}</span>
            </div>
        )}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </motion.div>
);

const HowItWorksStep = ({ icon, label, title, description, delay, colorClass }) => (
  <motion.div
    className="flex flex-col items-center text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <div className={`absolute top-0 left-0 w-full h-1 ${colorClass === 'orange' ? 'bg-brand-orange' : 'bg-brand-blue'}`}></div>
    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-lg mb-5 border border-slate-100">
      {icon}
    </div>
    {label && (
        <span className={`text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full ${colorClass === 'orange' ? 'text-orange-700 bg-orange-100' : 'text-blue-700 bg-blue-100'}`}>
            {label}
        </span>
    )}
    <h4 className="font-bold text-xl text-slate-900 mb-3">{title}</h4>
    <p className="text-slate-600 text-sm max-w-sm leading-relaxed">{description}</p>
  </motion.div>
);

const TestimonialCard = ({ avatar, name, role, quote, delay }) => (
  <motion.div
    className="p-8 rounded-2xl bg-white border border-slate-200 shadow-lg text-left"
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <div className="flex items-center mb-6">
      <img  alt={avatar} className="w-14 h-14 rounded-full mr-4 border-2 border-brand-orange shadow-sm object-cover" src="https://images.unsplash.com/photo-1653055270282-029e5ba3e3a6" />
      <div>
        <p className="font-bold text-slate-900 text-lg">{name}</p>
        <p className="text-sm font-medium text-brand-orange">{role}</p>
      </div>
    </div>
    <p className="text-slate-700 italic leading-relaxed mb-4">"{quote}"</p>
    <div className="flex">
      {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow-sm" />)}
    </div>
  </motion.div>
);

const LandingPage = () => {
  const testimonials = [
    { avatar: 'A smiling female referee', name: 'Sarah Chen', role: 'Certified Referee', quote: 'iWhistle revolutionized how I get games. The scheduling is seamless, and I get paid on time, every time. A total game-changer!', delay: 0.2 },
    { avatar: 'A confident male league manager', name: 'David Rodriguez', role: 'Youth League Manager', quote: 'Managing referees used to be a nightmare of spreadsheets and phone calls. Now, I can staff an entire tournament in minutes. I can\'t imagine running my league without it.', delay: 0.4 },
    { avatar: 'A young male referee looking at his phone', name: 'Mike Thompson', role: 'High School Referee', quote: 'As someone new to officiating, the performance feedback has been invaluable. It\'s helped me improve my skills and get higher-level assignments.', delay: 0.6 },
  ];

  const faqs = [
    { q: 'Is iWhistle free to use for officials?', a: 'Yes! Creating a profile, setting your availability, and getting assigned to games is completely free for referees. Our goal is to get you on the court.' },
    { q: 'How does payment processing work?', a: 'League managers handle payments through the platform. Once a game is marked as completed, your payment is processed. You can track all your earnings right from your dashboard.' },
    { q: 'What kind of leagues use this platform?', a: 'Our platform is perfect for all levels of basketball, from youth leagues like AAU and recreational leagues to semi-pro and adult tournaments.' },
    { q: 'Can I use this on my mobile device?', a: 'Absolutely! iWhistle is fully responsive and designed to work beautifully on your phone, so you can manage your schedule and assignments on the go.' },
  ];

  return (
    <>
      <Helmet>
        <title>iWhistle - Leadership Under Pressure</title>
        <meta name="description" content="iWhistle — Leadership Under Pressure. The professional platform for basketball officials to manage schedules, track performance, and elevate their officiating." />
      </Helmet>
      <div className="min-h-screen text-slate-900 overflow-hidden bg-slate-900 relative">
        {/* Background elements for dark theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-orange/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
          <header className="container mx-auto px-6 py-4 flex justify-between items-center backdrop-blur-md bg-slate-900/80 sticky top-0 z-50 border-b border-slate-800">
            <Link to="/" className="text-2xl font-bold flex items-center">
              <div className="w-8 h-8 mr-2 bg-white rounded-full p-1 shadow-sm flex items-center justify-center">
                <img  alt="iWhistle logo" className="w-full h-full object-contain" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
              </div>
              <span className="font-black tracking-tight" style={{color: '#0080C8'}}>i<span style={{color: '#FF8C00'}}>Whistle</span></span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/#features" className="text-slate-300 hover:text-white font-medium transition-colors">Features</a>
              <a href="/#how-it-works" className="text-slate-300 hover:text-white font-medium transition-colors">How It Works</a>
              <Link to="/about" className="text-slate-300 hover:text-white font-medium transition-colors">About</Link>
              <Link to="/contact" className="text-slate-300 hover:text-white font-medium transition-colors">Contact</Link>
            </nav>
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-slate-800 hover:text-white font-medium">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-md">Get Started</Button>
              </Link>
            </div>
          </header>

          <main className="container mx-auto px-6 text-center">
            <motion.div
              className="py-24 md:py-36"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-white"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(90deg, #0080C8 0%, #FF8C00 100%)'}}>Leadership Under</span> Pressure
              </motion.h1>
              <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-4 font-medium">
                The all-in-one platform for officials to find games, manage schedules, and track earnings — built for the world of basketball officiating.
              </p>
              <p className="text-sm text-slate-400 max-w-2xl mx-auto mb-10 font-medium tracking-wide uppercase">
                Master the Moment. Lead with Confidence.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link to="/register">
                  <Button size="lg" className="text-white text-lg font-bold px-10 py-7 shadow-xl rounded-full transition-all hover:scale-105" style={{backgroundColor: '#FF8C00'}}>
                    Start Your Journey <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <section id="features" className="py-24 relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-16 text-white tracking-tight">Why Officials Choose iWhistle</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<CheckCircle className="h-8 w-8 text-brand-blue" />}
                  label="Smart Booking"
                  title="Effortless Scheduling"
                  description="Accept game assignments, set your availability, and view your entire schedule at a glance with our intuitive calendar tools."
                  delay={0.2}
                />
                <FeatureCard
                  icon={<Users className="h-8 w-8 text-brand-orange" />}
                  label="League Control"
                  title="Seamless Management"
                  description="League managers can easily assign referees, manage complex tournaments, and communicate directly with their officiating staff."
                  delay={0.4}
                />
                <FeatureCard
                  icon={<BarChart2 className="h-8 w-8 text-green-600" />}
                  label="Data Insights"
                  title="Performance Analytics"
                  description="Track your earnings, review game history, and monitor your performance ratings to continually grow your refereeing career."
                  delay={0.6}
                />
              </div>
            </section>

            <section id="how-it-works" className="py-24 bg-white rounded-[3rem] p-8 md:p-16 my-12 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue"></div>
              <h2 className="text-4xl md:text-5xl font-bold mb-20 text-slate-900 tracking-tight">Get Started in Minutes</h2>
              <div className="grid md:grid-cols-2 gap-16">
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                  <h3 className="text-3xl font-bold mb-10 text-brand-orange flex items-center justify-center">
                      <span className="w-10 h-10 rounded-full bg-orange-100 text-brand-orange flex items-center justify-center mr-4 text-xl shadow-sm">1</span>
                      For Referees
                  </h3>
                  <div className="space-y-8">
                    <HowItWorksStep 
                        icon={<UserCheck className="h-10 w-10 text-brand-orange" />} 
                        label="Step 1: Setup" 
                        title="Create Your Profile" 
                        description="Sign up for free and build your professional referee profile, highlighting your experience, levels, and certifications." 
                        delay={0.2}
                        colorClass="orange" 
                    />
                    <HowItWorksStep 
                        icon={<CalendarDays className="h-10 w-10 text-brand-orange" />} 
                        label="Step 2: Schedule" 
                        title="Set Availability" 
                        description="Mark your available dates and times on your personal calendar so league managers know exactly when you can work." 
                        delay={0.4} 
                        colorClass="orange"
                    />
                    <HowItWorksStep 
                        icon={<DollarSign className="h-10 w-10 text-brand-orange" />} 
                        label="Step 3: Earn" 
                        title="Get Paid" 
                        description="Accept game assignments, officiate with excellence, and get paid securely and promptly through the platform." 
                        delay={0.6} 
                        colorClass="orange"
                    />
                  </div>
                </div>
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                  <h3 className="text-3xl font-bold mb-10 text-brand-blue flex items-center justify-center">
                      <span className="w-10 h-10 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center mr-4 text-xl shadow-sm">2</span>
                      For Managers
                  </h3>
                   <div className="space-y-8">
                    <HowItWorksStep 
                        icon={<ClipboardList className="h-10 w-10 text-brand-blue" />} 
                        label="Step 1: Create" 
                        title="Post Your Games" 
                        description="Create your tournament or league structure, and easily import or add all your game schedules in one place." 
                        delay={0.3} 
                        colorClass="blue"
                    />
                    <HowItWorksStep 
                        icon={<FileText className="h-10 w-10 text-brand-blue" />} 
                        label="Step 2: Staff" 
                        title="Assign Referees" 
                        description="Find and assign qualified, available referees to your games with just a few clicks based on their set availability." 
                        delay={0.5} 
                        colorClass="blue"
                    />
                    <HowItWorksStep 
                        icon={<MessageSquare className="h-10 w-10 text-brand-blue" />} 
                        label="Step 3: Connect" 
                        title="Manage & Communicate" 
                        description="Oversee all assignments, review submitted game reports, and communicate with your entire staff seamlessly." 
                        delay={0.7} 
                        colorClass="blue"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section id="testimonials" className="py-24">
              <h2 className="text-3xl md:text-5xl font-bold mb-16 text-white tracking-tight">Trusted by the Community</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <TestimonialCard key={index} {...testimonial} />
                ))}
              </div>
            </section>

            <section id="faq" className="py-24 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-12 text-white tracking-tight">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full text-left space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="bg-white border border-slate-200 rounded-xl px-6 py-2 shadow-sm">
                    <AccordionTrigger className="text-xl font-bold text-slate-900 hover:no-underline hover:text-brand-blue transition-colors">
                        <span className="flex items-center text-left">
                            {faq.q}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 text-lg leading-relaxed pt-2 pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

          </main>

          <footer className="text-center py-16 mt-12 bg-slate-950 border-t border-slate-800">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-4 gap-12 text-left mb-12">
                <div className="md:col-span-2">
                  <Link to="/" className="text-2xl font-bold flex items-center mb-6">
                    <div className="w-8 h-8 mr-2 bg-white rounded-full p-1 flex items-center justify-center">
                        <img  alt="iWhistle logo" className="w-full h-full object-contain" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
                    </div>
                    <span className="font-black text-white">i<span style={{color:'#FF8C00'}}>Whistle</span></span>
                  </Link>
                  <p className="text-slate-400 max-w-md leading-relaxed">
                    The professional officiating platform elevating basketball officials through education, scheduling, and community. Your whistle. Your journey. Your excellence.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold text-lg mb-6 text-white">Platform Links</h4>
                  <ul className="space-y-4">
                    <li><Link to="/about" className="text-slate-400 hover:text-brand-orange transition-colors font-medium">About Us</Link></li>
                    <li><Link to="/contact" className="text-slate-400 hover:text-brand-orange transition-colors font-medium">Contact Support</Link></li>
                    <li><a href="/#faq" className="text-slate-400 hover:text-brand-orange transition-colors font-medium">Help & FAQ</a></li>
                    <li><Link to="/register" className="text-slate-400 hover:text-brand-orange transition-colors font-medium">Create Account</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-6 text-white">Connect With Us</h4>
                  <p className="text-slate-400 mb-6 text-sm">Follow us on social media for the latest updates and referee tips.</p>
                  <div className="flex space-x-5">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-3 rounded-full text-slate-300 hover:bg-brand-blue hover:text-white transition-all transform hover:scale-110">
                        <FaTwitter size={20} />
                        <span className="sr-only">Twitter</span>
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-3 rounded-full text-slate-300 hover:bg-brand-blue hover:text-white transition-all transform hover:scale-110">
                        <FaFacebook size={20} />
                        <span className="sr-only">Facebook</span>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-3 rounded-full text-slate-300 hover:bg-brand-orange hover:text-white transition-all transform hover:scale-110">
                        <FaInstagram size={20} />
                        <span className="sr-only">Instagram</span>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p className="text-slate-500 font-medium mb-4 md:mb-0">
                    &copy; {new Date().getFullYear()} iWhistle. All rights reserved.
                </p>
                <div className="flex space-x-6 text-sm font-medium">
                    <a href="#" className="text-slate-500 hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="text-slate-500 hover:text-white transition-colors">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default LandingPage;