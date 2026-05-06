'use client'

import React, { useEffect } from 'react'
import { Phone, Video, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { useChatStore } from '@/store/useChatStore'
import { friendService } from '@/services/friendService'
import { supabase } from '@/lib/supabase/client'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatWindow({ currentUser, profile }: { currentUser: any, profile: any }) {
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId)
  const activeConversationId = useChatStore((state) => state.activeConversationId)
  const [activeConvData, setActiveConvData] = React.useState<any>(null)
  const [friendship, setFriendship] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const handleAddFriend = async () => {
    let otherId = activeConvData?.id;
    
    // Nếu là hội thoại đã tồn tại, ta cần lấy ID của người kia (không phải ID hội thoại)
    if (!activeConvData?.isNew && activeConversationId) {
      const { data } = await supabase
        .from('participants')
        .select('user_id')
        .eq('conversation_id', activeConversationId)
        .neq('user_id', currentUser.id)
        .maybeSingle();
      if (data) otherId = data.user_id;
    }

    if (!otherId) return;
    const { data, error } = await friendService.sendFriendRequest(otherId);
    if (error) {
      console.error('Add friend error:', error);
      return;
    }
    if (data) setFriendship(data);
  };

  useEffect(() => {
    if (!activeConversationId) return;

    const fetchConvDetail = async () => {
      setLoading(true);
      
      // Trường hợp 1: Đây là yêu cầu tạo hội thoại mới từ Tìm kiếm
      if (activeConversationId.startsWith('new:')) {
        const otherId = activeConversationId.split(':')[1];
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherId)
          .single();
        
        if (profileData) {
          setActiveConvData({
            name: profileData.full_name,
            avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.full_name}`,
            id: profileData.id,
            isNew: true
          });
          const { data: fData } = await friendService.getFriendshipStatus(profileData.id);
          setFriendship(fData);
        }
      } 
      // Trường hợp 2: Hội thoại đã tồn tại
      else {
        const { data } = await supabase
          .from('conversations')
          .select('*, participants:participants(user:profiles(*))')
          .eq('id', activeConversationId)
          .single();
        
        if (data) {
          let name = data.name || 'Người dùng Messenger'
          let avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
          
          if (!data.is_group) {
            const other = data.participants?.find((p: any) => p.user?.id !== currentUser.id)
            if (other?.user) {
              name = other.user.full_name || name
              avatar = other.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            }
          }
          
          setActiveConvData({ name, avatar, id: data.id, isNew: false })
          
          const otherId = data.participants?.find((p: any) => p.user?.id !== currentUser.id)?.user?.id
          if (otherId) {
            const { data: fData } = await friendService.getFriendshipStatus(otherId);
            setFriendship(fData);
          }
        }
      }
      setLoading(false);
    };

    fetchConvDetail();

    // Subscribe to friendship changes for this specific relationship
    const friendSub = supabase
      .channel(`friendship-${activeConversationId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friendships' 
      }, () => {
        fetchConvDetail(); // Refresh friendship status
      })
      .subscribe();

    return () => {
      friendSub.unsubscribe();
    };
  }, [activeConversationId, currentUser.id])

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black text-gray-400">
        Chọn một cuộc hội thoại để bắt đầu
      </div>
    )
  }

  const isFriend = friendship?.status === 'accepted';
  const isPending = friendship?.status === 'pending';

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#000000]">
      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-50 dark:border-gray-900">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-11 h-11 ring-2 ring-transparent">
               <AvatarImage src={activeConvData?.avatar} alt="Avatar" />
            </Avatar>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#31a24c] border-2 border-white dark:border-black rounded-full" />
          </div>
          <div>
            <h2 className="font-extrabold text-[16px] leading-tight text-[#1a1c1f] dark:text-white cursor-pointer hover:underline underline-offset-2">
              {activeConvData?.name || 'Đang tải...'}
            </h2>
            <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider">Đang hoạt động</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isFriend && !loading && (
            <Button 
              onClick={handleAddFriend}
              disabled={isPending}
              className="bg-[#004db0] hover:bg-[#003d8c] text-white rounded-full px-4 text-sm font-bold h-9"
            >
              {isPending ? 'Đã gửi lời mời' : 'Kết bạn'}
            </Button>
          )}
          {[Phone, Video, Info].map((Icon, i) => (
            <Button key={i} variant="ghost" size="icon" className="text-[#004db0] hover:bg-[#004db0]/5 dark:hover:bg-[#1c1c1d] rounded-full w-10 h-10 transition-all active:scale-90">
              <Icon className="w-5 h-5 fill-current" />
            </Button>
          ))}
        </div>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!isFriend && !loading && (
          <div className="flex flex-col items-center py-10 px-6 text-center border-b border-gray-50 dark:border-gray-900 bg-[#f9f9fd]/50 dark:bg-[#0c0c0d]/50">
            <Avatar className="w-20 h-20 mb-4 ring-4 ring-[#004db0]/10">
                <AvatarImage src={activeConvData?.avatar} />
            </Avatar>
            <h3 className="text-xl font-extrabold dark:text-white mb-1">{activeConvData?.name}</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Messenger • Bạn chưa là bạn bè trên Facebook</p>
            {!isPending && (
              <Button onClick={handleAddFriend} variant="outline" className="rounded-full border-[#004db0] text-[#004db0] font-bold hover:bg-[#004db0]/5">
                Thêm vào danh sách bạn bè
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          {!activeConvData?.isNew ? (
            <MessageList currentUser={currentUser} activeConversationId={activeConversationId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <p className="text-gray-400 text-sm italic mb-2">Bắt đầu vẫy tay chào {activeConvData?.name}!</p>
              <p className="text-[12px] text-gray-500 max-w-[250px]">Hãy kết bạn để có thể trò chuyện và xem khi nào họ hoạt động.</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Bar */}
      <ChatInput 
        currentUser={currentUser} 
        activeConversationId={activeConversationId} 
        isFriend={isFriend}
      />
    </div>
  )
}
