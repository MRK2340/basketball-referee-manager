import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Search,
  Plus,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Messages = () => {
  // Hooks at the top
  const { messages, sendMessage, markMessageAsRead } = useData();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  const filteredMessages = messages.filter(message =>
    (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (message.from && message.from.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (message.content && message.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const unreadCount = messages.filter(m => !m.read).length;

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setShowCompose(false);
    if (!message.read) {
      markMessageAsRead(message.id);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && newSubject.trim()) {
      sendMessage({
        subject: newSubject,
        content: newMessage,
      });
      setNewMessage('');
      setNewSubject('');
      setShowCompose(false);
    } else {
       toast({
        title: "Missing Information",
        description: "Please provide a subject and a message.",
        variant: "destructive"
      });
    }
  };

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Messages - Basketball Referee Manager</title>
        <meta name="description" content="Communicate with league managers and other referees through the messaging system." />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
            <p className="text-slate-600">
              Communicate with league managers and referees
              {unreadCount > 0 && (
                <Badge className="ml-2 basketball-gradient text-white border-0">
                  {unreadCount} new
                </Badge>
              )}
            </p>
          </div>
          
          <Button 
            className="basketball-gradient hover:opacity-90 text-white"
            onClick={() => {
              setShowCompose(true);
              setSelectedMessage(null);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 h-[70vh]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="glass-effect border-slate-200 h-full flex flex-col shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-brand-blue" />
                    <span>Inbox</span>
                  </CardTitle>
                </div>
                
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-300 text-slate-900 placeholder-slate-500"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-0 flex-grow overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-hide">
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                          selectedMessage?.id === message.id ? 'bg-slate-100 border-l-4 border-l-brand-orange' : ''
                        } ${!message.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold text-sm ${!message.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {message.from}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {!message.read && (
                              <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
                            )}
                            <span className="text-xs text-slate-500">
                              {new Date(message.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm mb-1 font-medium ${!message.read ? 'text-slate-900' : 'text-slate-600'}`}>
                          {message.subject}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {message.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center h-full flex flex-col justify-center items-center">
                      <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">No messages found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            {showCompose ? (
              <Card className="glass-effect border-slate-200 h-full shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Compose Message</CardTitle>
                  <CardDescription className="text-slate-600">
                    Send a message to a league manager.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-slate-800 text-sm font-medium">To:</label>
                     <Input
                      value="League Manager"
                      readOnly
                      className="bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-slate-800 text-sm font-medium">Subject:</label>
                    <Input
                      placeholder="Message subject..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-slate-800 text-sm font-medium">Message:</label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={8}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none scrollbar-hide"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleSendMessage}
                      className="basketball-gradient hover:opacity-90 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowCompose(false)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedMessage ? (
              <Card className="glass-effect border-slate-200 h-full flex flex-col shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-slate-900">{selectedMessage.subject}</CardTitle>
                      <CardDescription className="text-slate-600 mt-1">
                        <span className="font-medium text-slate-800">From: {selectedMessage.from}</span> • {new Date(selectedMessage.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFeatureClick('delete-message')}
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                  <div className="prose max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap h-full overflow-y-auto scrollbar-hide">
                    {selectedMessage.content}
                  </div>
                </CardContent>
                 <div className="p-6 mt-auto pt-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex space-x-3">
                      <Button 
                        className="bg-brand-blue hover:bg-brand-blue-deep text-white"
                        onClick={() => handleFeatureClick('reply-message')}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        onClick={() => handleFeatureClick('forward-message')}
                      >
                        Forward
                      </Button>
                    </div>
                  </div>
              </Card>
            ) : (
              <Card className="glass-effect border-slate-200 h-full shadow-sm">
                <CardContent className="p-12 text-center flex flex-col justify-center items-center h-full">
                  <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Message</h3>
                  <p className="text-slate-600 mb-6">
                    Choose a message from your inbox to read its content
                  </p>
                  <Button 
                    className="basketball-gradient hover:opacity-90 text-white"
                    onClick={() => setShowCompose(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Compose New Message
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Messages;