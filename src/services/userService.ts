import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export const userService = {
  /**
   * Tìm kiếm người dùng theo tên hoặc email (thông qua profiles)
   */
  async searchUsers(query: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    if (!query.trim()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', user.id) // Không tìm chính mình
      .limit(10);

    return { data, error };
  },

  /**
   * Lấy thông tin chi tiết một người dùng
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  }
};
