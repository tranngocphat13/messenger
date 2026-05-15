'use client'

import React from 'react'
import { Search, Settings, SquarePen, MessageCircle, Users, Archive, MessageSquare, LogOut, MoreHorizontal, MoreVertical, Phone, Video, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChatStore } from '@/store/useChatStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { conversationService } from '@/services/conversationService'
import { userService } from '@/services/userService'
import { friendService } from '@/services/friendService'
import { authService } from '@/services/authService'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { truncateMessage } from '@/lib/utils/stringUtils'

const navItems = [
  { icon: MessageCircle, label: 'Đoạn chat', active: true },
  { icon: Users, label: 'Mọi người', active: false },
  { icon: Archive, label: 'Kho lưu trữ', active: false },
]

export default function Sidebar({ currentUser, profile }: { currentUser: any, profile: any }) {
  const [conversations, setConversations] = React.useState<any[]>([])
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([])
  // friendshipStatuses: { [userId]: { status, isSender } | null }
  const [friendshipStatuses, setFriendshipStatuses] = React.useState<Record<string, any>>({})
  const [friendActionLoading, setFriendActionLoading] = React.useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('chats') // 'chats' | 'people' | 'archive'
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId)
  const activeConversationId = useChatStore((state) => state.activeConversationId)

  const handleArchive = async (e: React.MouseEvent, conversationId: string, isArchived: boolean) => {
    e.stopPropagation()
    await conversationService.archiveConversation(conversationId, isArchived)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, is_archived: isArchived } : c))
    if (activeConversationId === conversationId && isArchived) {
      setActiveConversationId(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    await conversationService.deleteConversation(conversationId)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, is_deleted: true } : c))
    if (activeConversationId === conversationId) {
      setActiveConversationId(null)
    }
  }

  const fetchPending = async () => {
    const { data } = await friendService.getPendingRequests();
    setPendingRequests(data || []);
  };

  const handleAccept = async (fromUserId: string) => {
    await friendService.acceptFriendRequest(fromUserId);
    fetchPending();
    // Cập nhật lại status trong search results nếu đang hiển thị
    if (friendshipStatuses[fromUserId] !== undefined) {
      setFriendshipStatuses(prev => ({ ...prev, [fromUserId]: { status: 'accepted', isSender: false } }))
    }
  };

  const handleDecline = async (fromUserId: string) => {
    await friendService.deleteFriendRequest(fromUserId);
    fetchPending();
    if (friendshipStatuses[fromUserId] !== undefined) {
      setFriendshipStatuses(prev => ({ ...prev, [fromUserId]: null }))
    }
  };

  const handleSendFriendRequest = async (toUserId: string) => {
    setFriendActionLoading(prev => ({ ...prev, [toUserId]: true }))
    const { error } = await friendService.sendFriendRequest(toUserId);
    if (!error) {
      setFriendshipStatuses(prev => ({ ...prev, [toUserId]: { status: 'pending', isSender: true } }))
    }
    setFriendActionLoading(prev => ({ ...prev, [toUserId]: false }))
  };

  const handleCancelRequest = async (toUserId: string) => {
    setFriendActionLoading(prev => ({ ...prev, [toUserId]: true }))
    await friendService.deleteFriendRequest(toUserId);
    setFriendshipStatuses(prev => ({ ...prev, [toUserId]: null }))
    setFriendActionLoading(prev => ({ ...prev, [toUserId]: false }))
  };

  React.useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await conversationService.getConversations()
      if (data) {
        const mapped = data.map((conv: any) => {
          let name = conv.name || 'Người dùng Messenger'
          let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`

          if (!conv.is_group) {
            const otherParticipant = conv.participants?.find((p: any) => p.user?.id !== currentUser.id)
            if (otherParticipant?.user) {
              const fallbackName = otherParticipant.user.email ? otherParticipant.user.email.split('@')[0] : 'Người dùng Messenger'
              name = otherParticipant.user.full_name || fallbackName
              avatar = otherParticipant.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            }
          }

          return {
            id: conv.id,
            name: name,
            avatar: avatar,
            lastMsg: conv.last_message_text
              ? truncateMessage(conv.last_message_text, 45)
              : 'Bắt đầu cuộc trò chuyện',
            time: conv.last_message_at ? format(new Date(conv.last_message_at), 'HH:mm') : '',
            online: false,
            unread: conv.unread_count || 0
          }
        })
        setConversations(mapped)
      }
      setLoading(false)
    }

    fetchConversations()
    fetchPending()

    // Subscribe to friend request changes
    const channel = supabase.channel('friend-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships'
      }, () => {
        fetchPending();
      })
      .subscribe();

    // Subscribe to new conversations (when added as a participant)
    const convChannel = supabase.channel('new-convs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'participants',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        fetchConversations();
      })
      .subscribe();

    // Subscribe to all new messages to update the sidebar last message and ordering
    const globalMessagesChannel = supabase.channel('sidebar-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        // Debounce or just fetch to update the sidebar
        fetchConversations();
      })
      .subscribe();

    // Subscribe to friendship changes to update pending requests
    const friendshipChannel = supabase.channel('sidebar-friendships')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
      }, () => {
        fetchPending();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      convChannel.unsubscribe();
      globalMessagesChannel.unsubscribe();
      friendshipChannel.unsubscribe();
    }
  }, [currentUser.id])

  React.useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length > 0) {
        const { data } = await userService.searchUsers(searchQuery)
        const results = data || []
        setSearchResults(results)
        // Lấy friendship status cho từng user trong kết quả
        const statuses: Record<string, any> = {}
        await Promise.all(
          results.map(async (u: any) => {
            const { data: fs } = await friendService.getFriendshipStatus(u.id)
            statuses[u.id] = fs ?? null
          })
        )
        setFriendshipStatuses(prev => ({ ...prev, ...statuses }))
      } else {
        setSearchResults([])
        setFriendshipStatuses({})
      }
    }

    const timer = setTimeout(handleSearch, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleOpenChat = async (user: any) => {
    // Chỉ cho mở chat nếu đã là bạn bè
    const fs = friendshipStatuses[user.id]
    if (!fs || fs.status !== 'accepted') return

    // Tìm xem đã có hội thoại 1-1 chưa
    const { data: convs } = await supabase
      .from('participants')
      .select('conversation_id')
      .eq('user_id', currentUser.id)

    if (convs && convs.length > 0) {
      const convIds = convs.map((c: any) => c.conversation_id)
      const { data: shared } = await supabase
        .from('participants')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('user_id', user.id)
        .single()

      if (shared) {
        setActiveConversationId(shared.conversation_id)
        setSearchQuery('')
        return
      }
    }

    // Chưa có hội thoại → tạo mới
    setActiveConversationId(`new:${user.id}`)
    setSearchQuery('')
  }
  return (
    <div className={`flex h-full w-full md:w-[420px] md:max-w-[420px] shrink-0 bg-white dark:bg-black overflow-hidden border-r border-gray-100 dark:border-gray-900 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
      {/* Left Navigation Rail (Premium addition) */}
      <div className="w-[72px] h-full flex flex-col items-center py-6 gap-4 bg-white dark:bg-[#000000] border-r border-gray-50 dark:border-gray-900">
        <div className="flex-1 flex flex-col gap-2">
          <TooltipProvider>
            {[
              { id: 'chats', icon: MessageCircle, label: 'Đoạn chat' },
              { id: 'people', icon: Users, label: 'Mọi người' },
              { id: 'archive', icon: Archive, label: 'Kho lưu trữ' },
            ].map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`p-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-[#004db0]/10 text-[#004db0]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900'}`}
                  >
                    <item.icon className="w-6 h-6" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
        <div className="flex flex-col items-center gap-2 mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-10 h-10 ring-2 ring-transparent hover:ring-[#004db0] transition-all cursor-pointer shadow-sm">
                <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'User'}`} />
                <AvatarFallback className="bg-gray-100 text-[#004db0] font-bold">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-gray-800 ml-2">
              <DropdownMenuLabel className="font-bold text-[13px] text-gray-500 uppercase tracking-wider px-3 py-2">Tài khoản</DropdownMenuLabel>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="font-bold text-[14px]">Tùy chọn</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2 bg-gray-50 dark:bg-gray-800" />
              <DropdownMenuItem
                onClick={() => authService.signOut()}
                className="rounded-xl flex items-center gap-3 p-3 cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-bold text-[14px]">Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[64px] text-center" title={currentUser?.email}>
            {currentUser?.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>

      {/* Main Sidebar Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full bg-[#f9f9fd] dark:bg-[#0c0c0d] overflow-hidden">
        {activeTab === 'chats' || activeTab === 'archive' ? (
          <>
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1c1f] dark:text-white">
                  {activeTab === 'chats' ? 'Đoạn chat' : 'Kho lưu trữ'}
                </h1>
                <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-[#1c1c1d] shadow-sm hover:scale-105 transition-all">
                  <SquarePen className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 w-full overflow-x-hidden">
              <div className="px-3 space-y-1 pb-4 w-full overflow-x-hidden">
                {conversations
                  .filter(chat => !chat.is_deleted)
                  .filter(chat => activeTab === 'archive' ? chat.is_archived : !chat.is_archived)
                  .map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setActiveConversationId(chat.id)}
                      className={`relative flex items-center gap-3 p-2.5 mx-1 rounded-xl cursor-pointer transition-all group w-auto overflow-hidden ${activeConversationId === chat.id
                          ? 'bg-white dark:bg-[#1c1c1d] shadow-sm'
                          : 'hover:bg-gray-100 dark:hover:bg-[#1c1c1d]/50'
                        }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 border border-gray-100 dark:border-gray-800">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} />
                          <AvatarFallback className="bg-[#004db0] text-white font-bold">{chat.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {chat.online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#31a24c] border-2 border-white dark:border-[#0c0c0d] rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center pr-10">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-semibold text-[14.5px] text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0" title={chat.name}>
                            {chat.name}
                          </span>
                          {!chat.unread && (
                            <span className="text-[11px] text-gray-400 font-medium shrink-0 group-hover:opacity-0 transition-opacity duration-200">
                              {chat.time}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 overflow-hidden">
                          <p className={`text-[13px] line-clamp-1 break-all flex-1 min-w-0 ${chat.unread > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500'}`}>
                            {chat.lastMsg}
                          </p>
                          {chat.unread > 0 && (
                            <div className="flex flex-col items-end shrink-0 group-hover:opacity-0 transition-opacity duration-200">
                              <span className="text-[11px] text-[#0084ff] font-bold mb-1">{chat.time}</span>
                              <div className="w-2.5 h-2.5 bg-[#0084ff] rounded-full shadow-sm" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Menu (Hover) - Always on top and strictly contained */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-full bg-white dark:bg-[#242526] hover:bg-gray-100 dark:hover:bg-[#3a3b3c] shadow-lg border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none flex items-center justify-center"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            side="right"
                            className="w-52 bg-white dark:bg-[#242526] border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-1 z-[100]"
                          >
                            <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 py-2.5 px-3 flex items-center gap-3 rounded-lg focus:bg-gray-100 dark:focus:bg-white/10">
                              <Phone className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-[13.5px]">Gọi thoại</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 py-2.5 px-3 flex items-center gap-3 rounded-lg focus:bg-gray-100 dark:focus:bg-white/10">
                              <Video className="w-4 h-4 text-purple-500" />
                              <span className="font-medium text-[13.5px]">Chat video</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 my-1" />
                            <DropdownMenuItem
                              onClick={(e) => handleArchive(e, chat.id, !chat.is_archived)}
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 py-2.5 px-3 flex items-center gap-3 rounded-lg focus:bg-gray-100 dark:focus:bg-white/10"
                            >
                              <Archive className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-[13.5px]">{chat.is_archived ? 'Bỏ lưu trữ' : 'Lưu trữ đoạn chat'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(e, chat.id)}
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 py-2.5 px-3 text-red-500 flex items-center gap-3 rounded-lg focus:bg-gray-100 dark:focus:bg-white/10"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="font-medium text-[13.5px]">Xoá đoạn chat</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                {conversations.filter(chat => !chat.is_deleted && (activeTab === 'archive' ? chat.is_archived : !chat.is_archived)).length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-gray-400 text-sm">Chưa có cuộc hội thoại nào</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : activeTab === 'people' ? (
          <>
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1c1f] dark:text-white">Mọi người</h1>
              </div>

              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#004db0] transition-colors" />
                <Input
                  placeholder="Tìm kiếm bạn bè mới..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#f3f3f7] dark:bg-[#1c1c1d] border-none rounded-xl h-11 focus-visible:ring-2 focus-visible:ring-[#004db0]/20 placeholder:text-gray-400 text-[14px]"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="space-y-4 pb-4">
                {searchQuery.trim() ? (
                  <div className="space-y-1">
                    <p className="px-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Kết quả tìm kiếm</p>
                    {searchResults.map((user) => {
                      const fs = friendshipStatuses[user.id]
                      const isFriend = fs?.status === 'accepted'
                      const isPendingSent = fs?.status === 'pending' && fs?.isSender === true
                      const isPendingReceived = fs?.status === 'pending' && fs?.isSender === false
                      const isLoading = !!friendActionLoading[user.id]
                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white dark:hover:bg-[#1c1c1d] transition-all"
                        >
                          <Avatar className="w-11 h-11 shrink-0">
                            <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} />
                            <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[14px] dark:text-white block truncate">
                              {user.full_name || user.email?.split('@')[0] || 'Người dùng'}
                            </span>
                            {/* Action buttons theo trạng thái */}
                            <div className="flex gap-2 mt-1.5">
                              {isFriend && (
                                <Button size="sm" onClick={() => handleOpenChat(user)}
                                  className="h-7 px-3 bg-[#004db0] text-white text-[11px] font-bold rounded-lg">
                                  Nhắn tin
                                </Button>
                              )}
                              {isPendingSent && (
                                <Button size="sm" variant="ghost" disabled={isLoading}
                                  onClick={() => handleCancelRequest(user.id)}
                                  className="h-7 px-3 text-gray-500 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-gray-700">
                                  {isLoading ? '...' : 'Đã gửi lời mời'}
                                </Button>
                              )}
                              {isPendingReceived && (
                                <>
                                  <Button size="sm" disabled={isLoading}
                                    onClick={() => handleAccept(user.id)}
                                    className="h-7 px-3 bg-[#004db0] text-white text-[11px] font-bold rounded-lg">
                                    Chấp nhận
                                  </Button>
                                  <Button size="sm" variant="ghost" disabled={isLoading}
                                    onClick={() => handleDecline(user.id)}
                                    className="h-7 px-3 text-gray-500 text-[11px] font-bold rounded-lg">
                                    Từ chối
                                  </Button>
                                </>
                              )}
                              {!fs && (
                                <Button size="sm" disabled={isLoading}
                                  onClick={() => handleSendFriendRequest(user.id)}
                                  className="h-7 px-3 bg-[#004db0]/10 text-[#004db0] text-[11px] font-bold rounded-lg hover:bg-[#004db0]/20">
                                  {isLoading ? '...' : '+ Kết bạn'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <>
                    {/* Pending Requests Section */}
                    {pendingRequests.length > 0 && (
                      <div className="space-y-1 mb-6">
                        <p className="px-3 text-[12px] font-bold text-[#004db0] uppercase tracking-wider mb-2">Lời mời kết bạn ({pendingRequests.length})</p>
                        {pendingRequests.map((req: any) => {
                          const otherUser = req.user_id1 === currentUser.id ? req.user2 : req.user1;
                          return (
                            <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#1c1c1d] shadow-sm border border-blue-50 dark:border-blue-900/20">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.full_name}`} />
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-[14px] dark:text-white block truncate">{otherUser?.full_name || (otherUser?.email ? otherUser.email.split('@')[0] : 'Người dùng Messenger')}</span>
                                <div className="flex gap-2 mt-1">
                                  <Button
                                    onClick={() => handleAccept(otherUser.id)}
                                    size="sm"
                                    className="h-7 px-3 bg-[#004db0] text-white text-[11px] font-bold rounded-lg"
                                  >
                                    Chấp nhận
                                  </Button>
                                  <Button
                                    onClick={() => handleDecline(otherUser.id)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-3 text-gray-500 text-[11px] font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    Xoá
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="text-center py-10 px-10">
                      <div className="w-16 h-16 bg-[#004db0]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-[#004db0]" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-bold mb-1">Tìm kiếm bạn bè</p>
                      <p className="text-gray-400 text-sm">Nhập tên để tìm kiếm người dùng trong hệ thống</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        ) : null}
      </div>
    </div>
  )
}
