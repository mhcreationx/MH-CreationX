import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Send, MessageCircle, AlertCircle, RefreshCw, CheckCheck } from 'lucide-react';
import { chatService, ChatMessage } from '../services/chatService';

const ROTATING_NAMES = ['MaHi', 'Moazzem Hossen', 'MaHin'];

export const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [nameIndex, setNameIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);
  const [visitorUnreadCount, setVisitorUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  // Initialize or retrieve visitor session ID
  const [visitorId] = useState(() => {
    let id = localStorage.getItem('mh_visitor_id');
    if (!id) {
      id = `vis_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('mh_visitor_id', id);
    }
    return id;
  });

  const [conversationId, setConversationId] = useState<string | null>(() => {
    return localStorage.getItem('mh_chat_conv_id') || null;
  });

  // Name rotation cycle: transitions smoothly every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNameIndex(prev => (prev + 1) % ROTATING_NAMES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Poll for status and messages
  const fetchChatData = async () => {
    try {
      const data = await chatService.getMessages({ conversationId: conversationId || undefined, visitorId });
      setIsOnline(data.online);
      setServerError(false);

      if (data.conversation) {
        if (!conversationId || conversationId !== data.conversation.id) {
          setConversationId(data.conversation.id);
          localStorage.setItem('mh_chat_conv_id', data.conversation.id);
        }
      }

      if (data.messages) {
        // If closed and new admin message arrived, increment unread badge
        if (!isOpen && data.messages.length > messages.length) {
          const newAdminMsgs = data.messages.filter(
            m => m.senderType === 'admin' && !messages.some(prev => prev.id === m.id)
          );
          if (newAdminMsgs.length > 0) {
            setVisitorUnreadCount(prev => prev + newAdminMsgs.length);
          }
        }
        setMessages(data.messages);
      }
    } catch (err) {
      // Don't break UI on transient network glitches
      setServerError(true);
    }
  };

  useEffect(() => {
    fetchChatData();
    // Poll every 3.5s for real-time responsiveness without overloading
    pollTimerRef.current = setInterval(fetchChatData, 3500);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [conversationId, visitorId, isOpen]);

  // Scroll to bottom when messages update or chat is opened
  useEffect(() => {
    if (isOpen) {
      setVisitorUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    if (text.length > 1000) {
      setErrorMessage('Message too long (max 1000 characters)');
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    // Optimistic message append
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: conversationId || '',
      senderType: 'visitor',
      senderName: 'You',
      text,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');

    try {
      const res = await chatService.sendMessage({
        conversationId: conversationId || undefined,
        visitorId,
        message: text
      });

      if (res.success) {
        if (res.conversationId && res.conversationId !== conversationId) {
          setConversationId(res.conversationId);
          localStorage.setItem('mh_chat_conv_id', res.conversationId);
        }
        // Replace optimistic with real message
        setMessages(prev => prev.map(m => (m.id === tempId ? res.message : m)));
        setServerError(false);
      }
    } catch (error: any) {
      setErrorMessage('Message could not be sent. Please try again.');
      // Remove failed optimistic message or keep for retry
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentDisplayName = ROTATING_NAMES[nameIndex];

  return (
    <div className="no-print">
      {/* 1. FLOATING CHAT BUTTON */}
      <div className="fixed bottom-6 right-6 z-[9990] flex items-center gap-3">
        {/* Helper preview bubble when closed & unread or greeting */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-3 py-2.5 px-4 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-indigo-950/10 cursor-pointer hover:border-indigo-500/50 transition-all select-none group"
            >
              <span className="flex h-2.5 w-2.5 relative">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </span>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                  {currentDisplayName}
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  {isOnline ? 'Live SMS Online' : 'Leave a message'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Floating Action Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close chat' : 'Open live chat'}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_12px_32px_rgba(79,70,229,0.38)] border border-white/25 hover:shadow-[0_16px_40px_rgba(79,70,229,0.5)] transition-all cursor-pointer backdrop-blur-md"
        >
          {/* Subtle glowing ring animation */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-pulse pointer-events-none" />

          {/* Online status indicator dot */}
          <span className="absolute top-1 right-1 flex h-4 w-4">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white dark:border-slate-900 ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </span>

          {/* Unread badge on button */}
          {visitorUnreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -left-1 bg-rose-500 text-white font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
              {visitorUnreadCount}
            </span>
          )}

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={26} strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="chat-icon"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <User size={26} strokeWidth={2.2} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* 4. CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[9990] w-[calc(100vw-2rem)] sm:w-[390px] h-[550px] max-h-[calc(100vh-8rem)] rounded-[2rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] flex flex-col overflow-hidden text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between shadow-md relative overflow-hidden">
              {/* Background ambient pattern */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

              <div className="flex items-center gap-3 min-w-0 z-10">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-inner text-white">
                    <User size={22} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                    {isOnline && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-indigo-700 ${
                        isOnline ? 'bg-emerald-400' : 'bg-slate-300'
                      }`}
                    />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="h-6 flex items-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.h4
                        key={currentDisplayName}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="font-black text-sm uppercase tracking-tight truncate text-white"
                      >
                        {currentDisplayName}
                      </motion.h4>
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 z-10">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Offline Alert notice if admin is currently offline */}
            {!isOnline && (
              <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                <span className="text-[11px] leading-tight">
                  Admin is currently offline. Leave a message and we'll reply soon!
                </span>
              </div>
            )}

            {/* Temporary server error notice if unreachable */}
            {serverError && (
              <div className="bg-amber-50 dark:bg-amber-950/40 px-4 py-2 border-b border-amber-200 dark:border-amber-900/40 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>Chat is temporarily connecting. Please wait...</span>
              </div>
            )}

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/60 dark:bg-slate-950/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mb-3 shadow-inner">
                    <MessageCircle size={28} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Direct Studio Chat
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
                    Send a message to discuss posters, banners, thumbnails, or custom graphic design!
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isVisitor = m.senderType === 'visitor';
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-baseline gap-1.5 mb-1 px-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {isVisitor ? 'You' : m.senderName || currentDisplayName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[84%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                          isVisitor
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                        }`}
                      >
                        {m.text}
                      </div>

                      {isVisitor && (
                        <div className="flex items-center gap-1 mt-0.5 px-1 text-slate-400">
                          <CheckCheck size={12} className={m.read ? 'text-indigo-500' : 'text-slate-400'} />
                          <span className="text-[8px] font-medium">
                            {m.read ? 'Seen' : 'Delivered'}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner if send failed */}
            {errorMessage && (
              <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between border-t border-rose-200 dark:border-rose-900/40">
                <span className="truncate">{errorMessage}</span>
                <button
                  onClick={() => handleSendMessage()}
                  className="font-bold underline ml-2 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {/* Input area */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type your message..."
                disabled={isSending}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium outline-none resize-none max-h-24 custom-scrollbar text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/25 flex-shrink-0 cursor-pointer"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveChatWidget;
