import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, User, Send, Clock, CheckCheck, RefreshCw, Archive,
  ArchiveRestore, ArrowLeft, Search, ShieldCheck, AlertCircle
} from 'lucide-react';
import { chatService, ChatConversation, ChatMessage } from '../services/chatService';
import { useAppStore } from '../store';

const ROTATING_NAMES = ['MaHi', 'Moazzem Hossen', 'MaHin'];

export const SmsManagement: React.FC = () => {
  const { currentUser } = useAppStore();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [tabStatus, setTabStatus] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [nameRotationIndex, setNameRotationIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  // Rotate display names smoothly for the admin persona
  useEffect(() => {
    const timer = setInterval(() => {
      setNameRotationIndex(prev => (prev + 1) % ROTATING_NAMES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all conversations list
  const loadConversations = async () => {
    try {
      const data = await chatService.getAdminConversations(tabStatus);
      setConversations(data.conversations || []);
      setTotalUnread(data.totalUnread || 0);
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to load conversations:', e);
      setIsLoading(false);
    }
  };

  // Fetch active conversation messages
  const loadActiveConversation = async (convId: string) => {
    try {
      const data = await chatService.getAdminConversation(convId);
      setActiveMessages(data.messages || []);
      // Update unread count locally in list
      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
      setTotalUnread(prev => Math.max(0, prev - (data.conversation?.unreadCount || 0)));
    } catch (e) {
      console.error('Failed to load conversation details:', e);
    }
  };

  // Heartbeat loop + list poller
  useEffect(() => {
    loadConversations();
    // Heartbeat every 20 seconds to keep admin status "Online"
    chatService.sendHeartbeat();
    const heartbeatTimer = setInterval(() => {
      chatService.sendHeartbeat();
    }, 20000);

    // Poll messages every 4 seconds
    pollTimerRef.current = setInterval(() => {
      loadConversations();
      if (selectedConvId) {
        loadActiveConversation(selectedConvId);
      }
    }, 4000);

    return () => {
      clearInterval(heartbeatTimer);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selectedConvId, tabStatus]);

  // When selected conversation changes
  useEffect(() => {
    if (selectedConvId) {
      loadActiveConversation(selectedConvId);
    } else {
      setActiveMessages([]);
    }
  }, [selectedConvId]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !selectedConvId || isSending) return;

    setIsSending(true);
    try {
      const currentSenderName = currentUser?.name || currentUser?.username || ROTATING_NAMES[nameRotationIndex];
      const res = await chatService.sendAdminReply({
        conversationId: selectedConvId,
        message: text,
        senderName: currentSenderName
      });

      if (res.success) {
        setActiveMessages(prev => [...prev, res.message]);
        setReplyText('');
        // Update last message in conversation list
        setConversations(prev =>
          prev.map(c =>
            c.id === selectedConvId
              ? { ...c, lastMessage: text, updatedAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (e) {
      console.error('Failed to send admin reply:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleArchive = async (convId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    try {
      await chatService.toggleArchive(convId, newStatus);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (selectedConvId === convId) {
        setSelectedConvId(null);
      }
    } catch (e) {
      console.error('Failed to archive conversation:', e);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.visitorName.toLowerCase().includes(query) ||
      c.visitorId.toLowerCase().includes(query) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(query))
    );
  });

  const selectedConversation = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Live SMS & Chat System
                </h1>
                {totalUnread > 0 && (
                  <span className="bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full animate-pulse">
                    {totalUnread} New
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Real-time conversations with website visitors • Active persona: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{ROTATING_NAMES[nameRotationIndex]}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Admin Online Indicator Status */}
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-4 py-2.5 rounded-2xl self-start sm:self-auto">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
              Admin Session Active
            </p>
            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              Visitors see you as 🟢 Online
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout: Split Conversations List & Active Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: Conversations List (5 Cols) */}
        <div
          className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden ${
            selectedConvId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header & Tabs */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <span>Conversations</span>
                <span className="text-xs font-bold text-slate-400">({filteredConversations.length})</span>
              </h2>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => { setTabStatus('active'); setSelectedConvId(null); }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    tabStatus === 'active'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => { setTabStatus('archived'); setSelectedConvId(null); }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    tabStatus === 'archived'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search visitors, messages..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <MessageSquare size={36} className="mb-2 opacity-30" />
                <p className="text-xs font-black uppercase tracking-wider">No conversations found</p>
                <p className="text-[11px] mt-1 text-slate-500">
                  {tabStatus === 'active' ? 'New visitor messages will appear here.' : 'No archived chats.'}
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === selectedConvId;
                const hasUnread = (conv.unreadCount || 0) > 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : hasUnread
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400'
                        : 'bg-white dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : hasUnread
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <User size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-black text-xs uppercase tracking-tight truncate ${
                              isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {conv.visitorName}
                          </p>
                          {hasUnread && !isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 animate-ping" />
                          )}
                        </div>
                        <p
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {conv.lastMessage || 'No messages'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[9px] font-bold ${
                          isSelected ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {hasUnread && !isSelected && (
                        <span className="bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Messages & Reply Box (7 Cols) */}
        <div
          className={`lg:col-span-7 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden ${
            !selectedConvId ? 'hidden lg:flex items-center justify-center' : 'flex'
          }`}
        >
          {selectedConvId && selectedConversation ? (
            <>
              {/* Chat View Header */}
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedConvId(null)}
                    className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white truncate">
                      {selectedConversation.visitorName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold truncate">
                      ID: {selectedConversation.visitorId} • Started {new Date(selectedConversation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleArchive(selectedConversation.id, selectedConversation.status)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {selectedConversation.status === 'active' ? (
                      <>
                        <Archive size={14} />
                        <span className="hidden sm:inline">Archive</span>
                      </>
                    ) : (
                      <>
                        <ArchiveRestore size={14} />
                        <span className="hidden sm:inline">Unarchive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 uppercase font-black tracking-wider">
                    No messages in conversation
                  </div>
                ) : (
                  activeMessages.map(msg => {
                    const isAdmin = msg.senderType === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {isAdmin ? `${msg.senderName} (Admin)` : selectedConversation.visitorName}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[80%] p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                            isAdmin
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply as ${currentUser?.name || currentUser?.username || ROTATING_NAMES[nameRotationIndex]}...`}
                  disabled={isSending}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Send size={15} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mb-4">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Select a conversation
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose an inquiry from the visitor list to review history and respond in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmsManagement;
