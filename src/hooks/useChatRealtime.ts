import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useChatStore } from '@/store/useChatStore';
import { ExtendedMessage } from '@/store/useChatStore';

/**
 * Custom Hook xử lý các sự kiện realtime cho Chat.
 * @param conversationId ID của cuộc hội thoại hiện tại
 */
export const useChatRealtime = (conversationId: string | null) => {
  const addMessage = useChatStore((state) => state.addMessage);
  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);
  const setTypingUsers = useChatStore((state) => state.setTypingUsers);
  
  // Lưu trữ các timeout để dọn dẹp khi nhận được sự kiện typing mới
  const typingTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!conversationId || conversationId.startsWith('new:')) return;

    const channelName = `conversation:${conversationId}`;
    
    // Cleanup any existing channel with the same name to prevent subscription errors
    const existingChannel = supabase.getChannels().find(
      (c) => c.topic === `realtime:${channelName}`
    );
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    // Khởi tạo channel cho cuộc hội thoại
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: 'online_users',
        },
      },
    });

    channelRef.current = channel;

    // 1. Lắng nghe tin nhắn mới (Postgres Changes)
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Realtime message received:', payload);
          const newMessage = payload.new as ExtendedMessage;
          addMessage({ ...newMessage, status: 'sent' });
        }
      )
      // 2. Lắng nghe sự kiện typing (Broadcast)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, isTyping } = payload;
        
        if (isTyping) {
          addTypingUser(userId);
          if (typingTimeoutsRef.current[userId]) {
            clearTimeout(typingTimeoutsRef.current[userId]);
          }
          typingTimeoutsRef.current[userId] = setTimeout(() => {
            removeTypingUser(userId);
            delete typingTimeoutsRef.current[userId];
          }, 3000);
        } else {
          removeTypingUser(userId);
          if (typingTimeoutsRef.current[userId]) {
            clearTimeout(typingTimeoutsRef.current[userId]);
            delete typingTimeoutsRef.current[userId];
          }
        }
      })
      // 3. Theo dõi trạng thái Online (Presence)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('Presence sync:', newState);
      })
      .subscribe(async (status) => {
        console.log(`Subscription status for ${conversationId}:`, status);
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, addMessage, addTypingUser, removeTypingUser]);

  /**
   * Hàm gửi sự kiện typing cho người khác trong room
   */
  const sendTypingStatus = async (userId: string, isTyping: boolean) => {
    if (!channelRef.current || !conversationId) return;
    
    await channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping },
    });
  };

  return { sendTypingStatus };
};
