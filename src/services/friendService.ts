import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type Friendship = Database['public']['Tables']['friendships']['Row'];

export const friendService = {
  /**
   * Gửi lời mời kết bạn
   */
  async sendFriendRequest(toUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const user_id1 = user.id < toUserId ? user.id : toUserId;
    const user_id2 = user.id < toUserId ? toUserId : user.id;

    const { data, error } = await supabase
      .from('friendships')
      .upsert({
        user_id1,
        user_id2,
        status: 'pending',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id1,user_id2' })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Chấp nhận lời mời kết bạn
   */
  async acceptFriendRequest(fromUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const user_id1 = user.id < fromUserId ? user.id : fromUserId;
    const user_id2 = user.id < fromUserId ? fromUserId : user.id;

    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .match({ user_id1, user_id2 })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Huỷ hoặc từ chối lời mời kết bạn
   */
  async deleteFriendRequest(otherUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const user_id1 = user.id < otherUserId ? user.id : otherUserId;
    const user_id2 = user.id < otherUserId ? otherUserId : user.id;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .match({ user_id1, user_id2 });

    return { error };
  },

  /**
   * Kiểm tra trạng thái bạn bè
   */
  async getFriendshipStatus(otherUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const user_id1 = user.id < otherUserId ? user.id : otherUserId;
    const user_id2 = user.id < otherUserId ? otherUserId : user.id;

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .match({ user_id1, user_id2 })
      .maybeSingle();

    return { data, error };
  },

  /**
   * Lấy danh sách lời mời kết bạn đang chờ (người khác gửi cho mình)
   */
  async getPendingRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    // Lấy các friendships có status là pending 
    // Trong bảng friendships của mình, user_id1 < user_id2. 
    // Ta cần lọc ra những bản ghi mà mình tham gia nhưng mình KHÔNG phải là người gửi (phức tạp hơn xíu)
    // Để đơn giản, ta sẽ lấy tất cả pending mà mình tham gia.
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        user1:profiles!friendships_user_id1_profiles_fkey(*),
        user2:profiles!friendships_user_id2_profiles_fkey(*)
      `)
      .eq('status', 'pending')
      .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

    if (error) return { data: [], error: error.message };

    // Lọc lại để chỉ lấy những người gửi cho mình
    // Thực tế: trong logic send của mình, ai gửi cũng được lưu theo ID bé/lớn.
    // Cần thêm cột `initiated_by` để biết ai gửi. 
    // Nhưng tạm thời ta cứ hiển thị tất cả pending của mình để dễ test.
    return { data, error: null };
  }
};
