import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type Conversation = Database['public']['Tables']['conversations']['Row'];

export const conversationService = {
  /**
   * Lấy danh sách các cuộc hội thoại của người dùng hiện tại
   */
  async getConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    // Lấy IDs của các cuộc hội thoại mà người dùng tham gia
    const { data: participantData, error: pError } = await supabase
      .from('participants')
      .select('conversation_id, is_archived, deleted_at')
      .eq('user_id', user.id);

    if (pError) return { data: [], error: pError.message };
    if (!participantData || participantData.length === 0) return { data: [], error: null };

    const participantMap = new Map();
    participantData.forEach(p => participantMap.set(p.conversation_id, p));

    const conversationIds = participantData.map(p => p.conversation_id);

    // Lấy thông tin chi tiết các cuộc hội thoại đó
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:participants(
          user:profiles(*)
        )
      `)
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false });

    // Lấy số lượng tin nhắn chưa đọc
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id)
      .or('is_read.eq.false,is_read.is.null');

    const unreadCountMap: Record<string, number> = {};
    if (unreadMessages) {
      unreadMessages.forEach(msg => {
        if (msg.conversation_id) {
          unreadCountMap[msg.conversation_id] = (unreadCountMap[msg.conversation_id] || 0) + 1;
        }
      });
    }

    if (data) {
      const enhancedData = data.map(conv => {
        const pInfo = participantMap.get(conv.id);
        const isDeleted = !!pInfo?.deleted_at;
        
        return {
          ...conv,
          unread_count: unreadCountMap[conv.id] || 0,
          is_archived: pInfo?.is_archived || false,
          is_deleted: isDeleted
        };
      });
      return { data: enhancedData, error };
    }

    return { data, error };
  },
  
  /**
   * Tạo một cuộc hội thoại mới giữa 2 người
   */
  async createConversation(otherUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    // 1. Tạo conversation mới
    const { data: conv, error: cError } = await supabase
      .from('conversations')
      .insert({ 
        is_group: false,
        created_by: user.id 
      })
      .select()
      .single();

    if (cError) return { data: null, error: cError.message };

    // 2. Thêm 2 người tham gia
    const { error: pError } = await supabase
      .from('participants')
      .insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId }
      ]);

    if (pError) return { data: null, error: pError.message };

    return { data: conv, error: null };
  },

  /**
   * Lưu trữ cuộc hội thoại
   */
  async archiveConversation(conversationId: string, isArchived: boolean = true) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('participants')
      .update({ is_archived: isArchived })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    return { error: error?.message || null };
  },

  /**
   * Xóa cuộc hội thoại (soft delete bằng deleted_at)
   */
  async deleteConversation(conversationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('participants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    return { error: error?.message || null };
  }
};
