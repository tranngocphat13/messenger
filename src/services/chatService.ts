import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export interface ChatServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export const chatService = {
  /**
   * Lấy danh sách tin nhắn của một cuộc hội thoại với phân trang.
   * @param conversationId ID của cuộc hội thoại
   * @param page Trang hiện tại (bắt đầu từ 0)
   * @param pageSize Số lượng tin nhắn mỗi trang
   */
  async getMessages(
    conversationId: string,
    page: number = 0,
    pageSize: number = 20
  ): Promise<ChatServiceResponse<Message[]>> {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error(`Error fetching messages:`, error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Unexpected error in getMessages:', err);
      return { data: null, error: 'An unexpected error occurred while fetching messages.' };
    }
  },

  /**
   * Gửi một tin nhắn mới.
   * @param content Nội dung tin nhắn
   * @param conversationId ID của cuộc hội thoại
   * @param senderId ID của người gửi
   */
  async sendMessage(
    content: string,
    conversationId: string,
    senderId: string
  ): Promise<ChatServiceResponse<Message>> {
    try {
      if (!content.trim()) {
        return { data: null, error: 'Message content cannot be empty.' };
      }

      const newMessage: MessageInsert = {
        text: content,
        conversation_id: conversationId,
        sender_id: senderId,
        type: 'text',
        is_read: false,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Unexpected error in sendMessage:', err);
      return { data: null, error: 'An unexpected error occurred while sending message.' };
    }
  },

  /**
   * Đánh dấu tin nhắn là đã đọc.
   * @param messageId ID của tin nhắn
   */
  async markAsRead(messageId: string): Promise<ChatServiceResponse<null>> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (err) {
      console.error('Unexpected error in markAsRead:', err);
      return { data: null, error: 'An unexpected error occurred while marking message as read.' };
    }
  }
};
