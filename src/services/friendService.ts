import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type Friendship = Database['public']['Tables']['friendships']['Row'];

export const friendService = {
  /**
   * Gửi lời mời kết bạn
   * - user_id1 < user_id2 (để đảm bảo unique constraint)
   * - initiated_by = người gửi
   */
  async sendFriendRequest(toUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const user_id1 = user.id < toUserId ? user.id : toUserId;
    const user_id2 = user.id < toUserId ? toUserId : user.id;

    const { data, error } = await supabase
      .from('friendships')
      .upsert({
        user_id1,
        user_id2,
        initiated_by: user.id,
        status: 'pending',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id1,user_id2' })
      .select()
      .single();

    return { data, error: error?.message ?? null };
  },

  /**
   * Chấp nhận lời mời kết bạn
   * Chỉ người NHẬN mới gọi được (RLS đảm bảo điều này ở DB)
   */
  async acceptFriendRequest(fromUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const user_id1 = user.id < fromUserId ? user.id : fromUserId;
    const user_id2 = user.id < fromUserId ? fromUserId : user.id;

    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .match({ user_id1, user_id2 })
      .select()
      .single();

    return { data, error: error?.message ?? null };
  },

  /**
   * Hủy lời mời đã gửi / Từ chối lời mời nhận / Hủy kết bạn
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

    return { error: error?.message ?? null };
  },

  /**
   * Kiểm tra trạng thái bạn bè giữa mình và người khác
   * Trả về:
   *   null        → chưa có quan hệ gì
   *   { status: 'pending', isSender: true }  → mình đã gửi, chờ họ chấp nhận
   *   { status: 'pending', isSender: false } → họ gửi cho mình, chờ mình chấp nhận
   *   { status: 'accepted' }                 → đã là bạn bè
   *   { status: 'blocked' }                  → đã bị block
   */
  async getFriendshipStatus(otherUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(user_id1.eq.${user.id},user_id2.eq.${otherUserId}),` +
        `and(user_id1.eq.${otherUserId},user_id2.eq.${user.id})`
      )
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null };

    return {
      data: {
        ...data,
        isSender: data.initiated_by === user.id,
      },
      error: null,
    };
  },

  /**
   * Lấy danh sách lời mời kết bạn NGƯỜI KHÁC gửi đến mình
   * (initiated_by != mình, status = 'pending', mình tham gia)
   */
  async getPendingRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        user1:profiles!friendships_user_id1_profiles_fkey(*),
        user2:profiles!friendships_user_id2_profiles_fkey(*)
      `)
      .eq('status', 'pending')
      .neq('initiated_by', user.id)  // ← chỉ lấy lời mời người khác gửi đến mình
      .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  },

  /**
   * Lấy danh sách lời mời kết bạn MÌNH đã gửi đi (đang chờ)
   */
  async getSentRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        user1:profiles!friendships_user_id1_profiles_fkey(*),
        user2:profiles!friendships_user_id2_profiles_fkey(*)
      `)
      .eq('status', 'pending')
      .eq('initiated_by', user.id);  // ← chỉ lấy lời mời mình đã gửi

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  },

  /**
   * Lấy danh sách bạn bè đã accepted
   */
  async getFriends() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        user1:profiles!friendships_user_id1_profiles_fkey(*),
        user2:profiles!friendships_user_id2_profiles_fkey(*)
      `)
      .eq('status', 'accepted')
      .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  },
};
