import { create } from 'zustand';
import { Message } from '@/services/chatService';

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ExtendedMessage extends Message {
  status?: MessageStatus;
}

interface ChatStore {
  messages: ExtendedMessage[];
  activeConversationId: string | null;
  typingUsers: string[];

  // Actions
  setActiveConversationId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  
  /**
   * Thêm tin nhắn vào store. Hỗ trợ Optimistic UI bằng cách cho phép
   * truyền tin nhắn với trạng thái 'sending'.
   */
  addMessage: (message: ExtendedMessage) => void;
  
  /**
   * Cập nhật một tin nhắn đã tồn tại (ví dụ: sau khi gửi thành công hoặc thất bại).
   * @param messageId ID hiện tại của tin nhắn (có thể là temp ID)
   * @param updates Các trường cần cập nhật
   */
  updateMessage: (messageId: string, updates: Partial<ExtendedMessage>) => void;
  
  setTypingUsers: (userIds: string[]) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  activeConversationId: null,
  typingUsers: [],

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setMessages: (messages) => set({ messages: messages.map(m => ({ ...m, status: 'sent' })) }),

  addMessage: (message) => set((state) => {
    const exists = state.messages.some(m => m.id === message.id);
    if (exists) {
      return {
        messages: state.messages.map(m => m.id === message.id ? { ...m, ...message } : m)
      };
    }
    return {
      messages: [message, ...state.messages],
    };
  }),

  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((m) => 
      m.id === messageId ? { ...m, ...updates } : m
    ),
  })),

  setTypingUsers: (userIds) => set({ typingUsers: userIds }),

  addTypingUser: (userId) => set((state) => ({
    typingUsers: state.typingUsers.includes(userId) 
      ? state.typingUsers 
      : [...state.typingUsers, userId],
  })),

  removeTypingUser: (userId) => set((state) => ({
    typingUsers: state.typingUsers.filter((id) => id !== userId),
  })),

  clearMessages: () => set({ messages: [] }),
}));
