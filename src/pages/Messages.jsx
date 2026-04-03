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
  Reply,
  Forward
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Messages = () => {
  const { messages, sendMessage, markMessageAsRead } = useData();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newRecipientId, setNewRecipientId] = useState(null);
  const [newRecipientName, setNewRecipientName] = useState('League Manager');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState('new');

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

  const openNewCompose = () => {
    setComposeMode('new');
    setNewSubject('');
    setNewMessage('');
    setNewRecipientId(null);
    setNewRecipientName('League Manager');
    setShowCompose(true);
    setSelectedMessage(null);
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setComposeMode('reply');
    setNewSubject(`Re: ${selectedMessage.subject}`);
    setNewMessage('');
    setNewRecipientId(selectedMessage.sender_id);
    setNewRecipientName(selectedMessage.from);
    setShowCompose(true);
  };

  const handleForward = () => {
    if (!selectedMessage) return;
    setComposeMode('forward');
    setNewSubject(`Fwd: ${selectedMessage.subject}`);
    setNewMessage(
      `\n\n--- Forwarded Message ---\nFrom: ${selectedMessage.from}\nDate: ${new Date(selectedMessage.timestamp).toLocaleString()}\n\n${selectedMessage.content}`
    );
    setNewRecipientId(null);
    setNewRecipientName('League Manager');
    setShowCompose(true);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && newSubject.trim()) {
      sendMessage({
        subject: newSubject,
        content: newMessage,
        recipientId: newRecipientId,
      });
      setNewMessage('');
      setNewSubject('');
      setNewRecipientId(null);
      setShowCompose(false);
    } else {
      toast({
        title: "Missing Information",
        description: "Please provide a subject and a message.",
        variant: "destructive"
      });
    }
  };

  const composeTitles = { new: 'Compose Message', reply: 'Reply', forward: 'Forward Message' };

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
          data-testid="messages-page-header"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
            <div className="flex items-center gap-2 flex-wrap text-slate-600" data-testid="messages-page-subtitle-row">
              <p>Communicate with league managers and referees</p>
              {unreadCount > 0 && (
                <Badge className="basketball-gradient text-white border-0" data-testid="messages-unread-count-badge">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </div>
          <Button
            className="basketball-gradient hover:opacity-90 text-white"
            data-testid="messages-new-message-button"
            onClick={openNewCompose}
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
                <CardTitle className="text-slate-900 flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-brand-blue" />
                  <span>Inbox</span>
                </CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <Input
                    data-testid="messages-search-input"
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
                        data-testid={`message-list-item-${message.id}`}
                        className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                          selectedMessage?.id === message.id ? 'bg-slate-100 border-l-4 border-l-brand-orange' : ''
                        } ${!message.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold text-sm ${!message.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {message.from}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {!message.read && <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />}
                            <span className="text-xs text-slate-500">{new Date(message.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className={`text-sm mb-1 font-medium ${!message.read ? 'text-slate-900' : 'text-slate-600'}`}>
                          {message.subject}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{message.content}</p>
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
                  <CardTitle className="text-slate-900">{composeTitles[composeMode]}</CardTitle>
                  <CardDescription className="text-slate-600">
                    {composeMode === 'reply'
                      ? `Replying to ${newRecipientName}`
                      : composeMode === 'forward'
                      ? 'Forwarding to League Manager'
                      : 'Send a message to a league manager.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-slate-800 text-sm font-medium">To:</label>
                    <Input
                      data-testid="messages-compose-recipient-input"
                      value={newRecipientName}
                      readOnly
                      className="bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-800 text-sm font-medium">Subject:</label>
                    <Input
                      data-testid="messages-compose-subject-input"
                      placeholder="Message subject..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-800 text-sm font-medium">Message:</label>
                    <textarea
                      data-testid="messages-compose-body-input"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={8}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none scrollbar-hide"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      data-testid="messages-send-button"
                      onClick={handleSendMessage}
                      className="basketball-gradient hover:opacity-90 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button
                      variant="outline"
                      data-testid="messages-cancel-compose-button"
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
                  <CardTitle className="text-slate-900">{selectedMessage.subject}</CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    <span className="font-medium text-slate-800">From: {selectedMessage.from}</span> •{' '}
                    {new Date(selectedMessage.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                  <div className="prose max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap h-full overflow-y-auto scrollbar-hide">
                    {selectedMessage.content}
                  </div>
                </CardContent>
                <div className="p-6 mt-auto pt-6 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex space-x-3">
                    <Button
                      data-testid="messages-reply-button"
                      className="bg-brand-blue hover:bg-brand-blue-deep text-white"
                      onClick={handleReply}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      data-testid="messages-forward-button"
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                      onClick={handleForward}
                    >
                      <Forward className="h-4 w-4 mr-2" />
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
                  <p className="text-slate-600 mb-6">Choose a message from your inbox to read its content</p>
                  <Button
                    className="basketball-gradient hover:opacity-90 text-white"
                    data-testid="messages-compose-placeholder-button"
                    onClick={openNewCompose}
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
