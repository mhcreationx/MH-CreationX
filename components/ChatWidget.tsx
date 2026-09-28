import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Send, MessageCircle, AlertCircle, RefreshCw, CheckCheck, Volume2, VolumeX } from 'lucide-react';
import { chatService, ChatMessage } from '../services/chatService';
import { chatAudio } from '../utils/chatAudio';

const ROTATING_NAMES = ['MaHi', 'Moazzem Hossen', 'MaHin'];

/**
 * ChatWidget component:
 * - Floating circular button with glassmorphic styling at the bottom-right corner.
 * - Framer Motion slide, fade, scale, floating bounce, and pulse animations.
 * - React state interval cycling through 'MaHi', 'Moazzem Hossen', and 'MaHin'.
 * - Real admin online/offline detection and full interactive live chat conversation window.
 */
export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [nameIndex, setNameIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);
  const [visitorUnreadCount, setVisitorUnreadCount] = useState(0);
  const [isMuted, setIsMuted] = useState(() => chatAudio.initMuteState());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);
  const initialLoadRef = useRef(true);

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

  // Cycle through names 'MaHi', 'Moazzem Hossen', and 'MaHin' at natural interval (5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setNameIndex(prev => (prev + 1) % ROTATING_NAMES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Poll for admin status and conversation updates
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
        // If closed and new admin message arrived, increment unread badge and play gentle audio chime
        if (data.messages.length > messages.length) {
          const newAdminMsgs = data.messages.filter(
            m => m.senderType === 'admin' && !messages.some(prev => prev.id === m.id)
          );
          if (newAdminMsgs.length > 0) {
            if (!initialLoadRef.current) {
              chatAudio.playReceive();
            }
            if (!isOpen) {
              setVisitorUnreadCount(prev => prev + newAdminMsgs.length);
            }
          }
        }
        setMessages(data.messages);
        initialLoadRef.current = false;
      }
    } catch (err) {
      setServerError(true);
    }
  };

  useEffect(() => {
    fetchChatData();
    pollTimerRef.current = setInterval(fetchChatData, 3500);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [conversationId, visitorId, isOpen]);

  // Scroll to bottom when new messages arrive or chat opens
  useEffect(() => {
    if (isOpen) {
      setVisitorUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages.length]);

  const toggleChatOpen = () => {
    if (!isOpen) {
      chatAudio.playOpen();
      setIsOpen(true);
    } else {
      chatAudio.playClose();
      setIsOpen(false);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = chatAudio.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      chatAudio.playTap();
    }
  };

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
    chatAudio.playSend();

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
        setMessages(prev => prev.map(m => (m.id === tempId ? res.message : m)));
        setServerError(false);
      }
    } catch (error: any) {
      setErrorMessage('Message could not be sent. Please try again.');
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
      {/* FLOATING GLASSMORPHIC BUTTON & NAME BADGE (Bottom-Right Corner) */}
      {/* Adheres to index.css z-index system (below modals and overlays: z-dropdown = 500) */}
      <div className="fixed bottom-6 right-6 z-dropdown flex items-center gap-3">
        {/* Name Cycle Floating Pill with Slide & Fade Animation */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 25, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 15, scale: 0.92 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={() => {
                chatAudio.playOpen();
                setIsOpen(true);
              }}
              className="hidden sm:flex items-center gap-3 py-2.5 px-4 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_12px_32px_rgba(15,23,42,0.14)] cursor-pointer hover:border-indigo-500/40 hover:bg-white/90 dark:hover:bg-slate-900/90 transition-all select-none group"
            >
              {/* Pulsing Online / Offline Status Dot */}
              <span className="flex h-2.5 w-2.5 relative">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 shadow-sm ${
                    isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </span>

              <div className="flex flex-col text-left">
                {/* Smooth Sliding Name Transition */}
                <div className="h-4 flex items-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentDisplayName}
                      initial={{ opacity: 0, y: 7, filter: 'blur(2px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -7, filter: 'blur(2px)' }}
                      transition={{ duration: 0.32, ease: 'easeInOut' }}
                      className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                    >
                      {currentDisplayName}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400">
                  {isOnline ? '🟢 Live SMS Online' : '⚪ Leave a message'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Circular Glassmorphic Button with Pulse & Float Animation */}
        <motion.button
          onClick={toggleChatOpen}
          aria-label={isOpen ? 'Close chat' : `Open live chat with ${currentDisplayName}`}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.94 }}
          animate={{
            y: isOpen ? 0 : [0, -3.5, 0],
          }}
          transition={{
            y: {
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-[0_16px_40px_rgba(79,70,229,0.38)] border border-white/40 hover:shadow-[0_20px_50px_rgba(79,70,229,0.55)] transition-all cursor-pointer backdrop-blur-2xl"
        >
          {/* Subtle Ambient Pulse Ring */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/25 animate-pulse pointer-events-none" />

          {/* Online status indicator dot with Ping animation */}
          <span className="absolute top-1 right-1 flex h-4 w-4 z-10">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white dark:border-slate-900 shadow-sm ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </span>

          {/* Unread badge on button */}
          {visitorUnreadCount > 0 && !isOpen && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -left-1 bg-rose-500 text-white font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce z-20"
            >
              {visitorUnreadCount}
            </motion.span>
          )}

          {/* Icon state transition */}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <X size={26} strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="chat-icon"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <User size={26} strokeWidth={2.2} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* COMPACT CHAT WINDOW */}
      {/* Uses z-modal from index.css to stay on top of content while avoiding conflict with full screen overlays */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 sm:right-6 z-modal w-[calc(100vw-2rem)] sm:w-[390px] h-[550px] max-h-[calc(100vh-8rem)] rounded-[2rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] flex flex-col overflow-hidden text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md relative overflow-hidden">
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

              <div className="flex items-center gap-1.5 z-10">
                {/* Audio feedback mute toggle button */}
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute chat sounds' : 'Mute chat sounds'}
                  aria-label={isMuted ? 'Unmute chat audio feedback' : 'Mute chat audio feedback'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <button
                  type="button"
                  onClick={toggleChatOpen}
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

            {/* Temporary server notice if connection is interrupted */}
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

export default ChatWidget;
