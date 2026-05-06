import { supabase } from '@/lib/supabase/client';

export const authService = {
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      return { error };
    }
    // Redirect to login page
    window.location.href = '/login';
    return { error: null };
  }
};
