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
      .select('conversation_id')
      .eq('user_id', user.id);

    if (pError) return { data: [], error: pError.message };
    if (!participantData || participantData.length === 0) return { data: [], error: null };

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
  }
};
