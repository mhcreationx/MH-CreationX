import api from './api';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'visitor' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  visitorId: string;
  visitorName: string;
  status: 'active' | 'archived';
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

export const chatService = {
  // Visitor: Get admin online status
  getStatus: async (): Promise<{ online: boolean; lastActive: number }> => {
    try {
      const res = await api.get('/chat/status.php');
      return res.data;
    } catch (e) {
      return { online: false, lastActive: 0 };
    }
  },

  // Admin: Send heartbeat to report active status
  sendHeartbeat: async () => {
    try {
      const res = await api.post('/chat/heartbeat.php');
      return res.data;
    } catch (e) {
      return null;
    }
  },

  // Visitor: Send message
  sendMessage: async (data: {
    conversationId?: string;
    visitorId: string;
    visitorName?: string;
    message: string;
  }): Promise<{ success: boolean; message: ChatMessage; conversationId: string; visitorId: string }> => {
    const res = await api.post('/chat/send.php', data);
    return res.data;
  },

  // Visitor: Poll messages
  getMessages: async (params: { conversationId?: string; visitorId?: string }): Promise<{
    conversation: ChatConversation | null;
    messages: ChatMessage[];
    online: boolean;
  }> => {
    const res = await api.get('/chat/messages.php', { params });
    return res.data;
  },

  // Admin: Get all conversations
  getAdminConversations: async (status?: string): Promise<{
    conversations: ChatConversation[];
    totalUnread: number;
  }> => {
    const res = await api.get('/chat/admin/conversations.php', { params: { status } });
    return res.data;
  },

  // Admin: Get single conversation with message history (marks read)
  getAdminConversation: async (id: string): Promise<{
    conversation: ChatConversation;
    messages: ChatMessage[];
  }> => {
    const res = await api.get('/chat/admin/conversation.php', { params: { id } });
    return res.data;
  },

  // Admin: Reply to message
  sendAdminReply: async (data: {
    conversationId: string;
    message: string;
    senderName?: string;
  }): Promise<{ success: boolean; message: ChatMessage }> => {
    const res = await api.post('/chat/admin/reply.php', data);
    return res.data;
  },

  // Admin: Archive or restore
  toggleArchive: async (conversationId: string, status: 'active' | 'archived') => {
    const res = await api.post('/chat/admin/archive.php', { conversationId, status });
    return res.data;
  }
};
