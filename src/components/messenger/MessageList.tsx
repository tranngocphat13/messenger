'use client'

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { chatService } from '@/services/chatService';
import { Reply, Trash2, MoreVertical, Smile, CornerUpLeft, Pin, Forward, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageListProps {
  currentUser: any;
  activeConversationId: string;
  otherUserAvatar?: string;
  otherUserName?: string;
}

const MessageText = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const maxLength = 1000;

  if (!text || text.length <= maxLength) return <>{text}</>;

  return (
    <div className="flex flex-col gap-1">
      <span className="break-words [word-break:break-word] overflow-wrap-anywhere whitespace-pre-wrap">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </span>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-[12px] font-bold underline underline-offset-2 opacity-90 hover:opacity-100 w-fit text-blue-600 dark:text-blue-400 mt-1"
      >
        {isExpanded ? 'Show less' : 'See more'}
      </button>
    </div>
  );
};

export default function MessageList({ currentUser, activeConversationId, otherUserAvatar, otherUserName }: MessageListProps) {
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const setReplyingToMessage = useChatStore((state) => state.setReplyingToMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Index của tin nhắn cuối cùng do MÌNH gửi (trong mảng đảo ngược)
  // messages[0] = mới nhất, messages[len-1] = cũ nhất
  const lastMyMessageIndex = messages.findIndex(m => m.sender_id === currentUser.id && !m.is_deleted);

  // Index tin nhắn cuối cùng mình gửi đã được người kia đọc
  const lastReadByOtherIndex = messages.findIndex(
    m => m.sender_id === currentUser.id && m.is_read && !m.is_deleted
  );

  const handleUnsend = async (messageId: string) => {
    // Optimistic UI update
    updateMessage(messageId, { is_deleted: true });
    await chatService.unsendMessage(messageId);
  };

  const handleReply = (message: any) => {
    setReplyingToMessage(message);
  };

  // Fetch tin nhắn ban đầu
  useEffect(() => {
    const fetchInitialMessages = async () => {
      const { data, error } = await chatService.getMessages(activeConversationId);
      if (data) {
        setMessages(data);
        // Mark conversation as read
        await chatService.markConversationAsRead(activeConversationId, currentUser.id);
      }
    };

    if (activeConversationId) {
      if (!activeConversationId.startsWith('new:')) {
        fetchInitialMessages();
      } else {
        // Clear messages if it's a new conversation
        setMessages([]);
      }
    }
  }, [activeConversationId, setMessages]);

  // Kích hoạt realtime cho cuộc hội thoại này
  useChatRealtime(activeConversationId);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 bg-[#f9f9fd]/30 dark:bg-[#000000]">
      <div className="flex flex-col py-6">
        {/* Welcome Section */}
        <div className="text-center py-12 mb-8">
          <Avatar className="w-28 h-28 mx-auto mb-6 shadow-2xl shadow-blue-500/10 ring-4 ring-white dark:ring-[#1c1c1d]">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Trần Ngọc Phát" />
          </Avatar>
          <h3 className="font-extrabold text-2xl text-[#1a1c1f] dark:text-white tracking-tight">Trần Ngọc Phát</h3>
          <p className="text-[14px] text-gray-500 mt-2 font-medium">Chuyên gia thiết kế giao diện tại Meta</p>
        </div>

        {/* Message Items */}
        <div className="space-y-1.5 flex flex-col-reverse">
          {/* Vì messages trong store được lưu theo thứ tự mới nhất lên đầu (desc), 
              nên ta dùng flex-col-reverse để hiển thị tin nhắn mới nhất ở dưới cùng */}
          <div ref={scrollRef} />
          {messages.map((msg, index) => {
            const isMine = msg.sender_id === currentUser.id;
            const isLastInGroup = index === 0 || messages[index - 1].sender_id !== msg.sender_id;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} mb-0.5`}
              >
                {!isMine && isLastInGroup ? (
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Trần Ngọc Phát" />
                  </Avatar>
                ) : !isMine && (
                  <div className="w-7" />
                )}

                <div className={`max-w-[70%] group relative flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {/* Quoted Message (Reply) */}
                  {msg.reply_to_id && !msg.is_deleted && (
                    <div className="mb-1 text-[12px] bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg text-gray-500 max-w-full truncate opacity-80">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 mr-1">Đã trả lời:</span>
                      {messages.find(m => m.id === msg.reply_to_id)?.is_deleted ? 'Tin nhắn đã bị thu hồi' : (messages.find(m => m.id === msg.reply_to_id)?.text || 'Tin nhắn cũ...')}
                    </div>
                  )}

                  <div className="flex items-center gap-2 relative">
                    {/* Action buttons (only show on hover) */}
                    {/* Action buttons (only show on hover) */}
                    {isMine && !msg.is_deleted && (
                      <div className="flex opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto has-[[data-state=open]]:pointer-events-auto items-center gap-1 absolute right-full pr-2 top-1/2 -translate-y-1/2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-[#242526] text-[#e4e6eb] border-gray-700">
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 py-2 focus:bg-white/10" onClick={() => handleReply(msg)}>
                              Trả lời
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 py-2 focus:bg-white/10 text-red-400 focus:text-red-400" onClick={() => handleUnsend(msg.id)}>
                              Thu hồi
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 py-2 focus:bg-white/10">
                              Chuyển tiếp
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 py-2 focus:bg-white/10">
                              Ghim
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button onClick={() => handleReply(msg)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                          <Reply className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {!isMine && !msg.is_deleted && (
                      <div className="flex opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto has-[[data-state=open]]:pointer-events-auto items-center gap-1 absolute left-full pl-2 top-1/2 -translate-y-1/2">
                        <button className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                          <Smile className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReply(msg)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                          <Reply className="w-4 h-4" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48 bg-[#242526] text-[#e4e6eb] border-gray-700">
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 py-2 focus:bg-white/10" onClick={() => handleReply(msg)}>
                              Trả lời
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 py-2 focus:bg-white/10">
                              Chuyển tiếp
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 py-2 focus:bg-white/10">
                              Ghim
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 py-2 focus:bg-white/10">
                              Báo cáo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    <div
                      className={`chat-bubble-text px-4 py-2.5 text-[15px] leading-relaxed shadow-sm transition-all ${
                        msg.is_deleted
                          ? 'bg-transparent border border-gray-200 dark:border-gray-800 text-gray-400 italic shadow-none'
                          : isMine
                          ? 'bg-[#004db0] text-white shadow-blue-500/10'
                          : 'bg-white dark:bg-[#1c1c1d] text-[#1a1c1f] dark:text-white shadow-gray-200/50'
                      } ${
                        isMine
                          ? (isLastInGroup ? 'rounded-[18px] rounded-br-[4px]' : 'rounded-[18px]')
                          : (isLastInGroup ? 'rounded-[18px] rounded-bl-[4px]' : 'rounded-[18px]')
                      } ${msg.status === 'sending' ? 'opacity-70 italic' : ''}`}
                    >
                      {msg.is_deleted ? 'Tin nhắn đã bị thu hồi' : (
                        <MessageText text={msg.text} />
                      )}
                      {isMine && msg.status === 'sending' && !msg.is_deleted && (
                        <span className="text-[10px] block text-right mt-1 opacity-50">Đang gửi...</span>
                      )}
                    </div>
                  </div>

                  {/* ── Trạng thái tin nhắn (chỉ hiện dưới tin nhắn của mình) ── */}
                  {isMine && !msg.is_deleted && (() => {
                    // "Đang gửi" — đã xử lý trong bubble, không cần lại ở đây
                    if (msg.status === 'sending') return null;

                    // "Đã xem" — hiện dưới tin nhắn cuối mình gửi mà người kia đã đọc
                    if (index === lastReadByOtherIndex) {
                      return (
                        <div className="flex items-center justify-end gap-1 mt-0.5 pr-0.5">
                          <span className="text-[11px] text-gray-400 font-medium">Đã xem</span>
                          <img
                            src={otherUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}`}
                            alt={otherUserName}
                            title={`${otherUserName} đã xem`}
                            className="w-4 h-4 rounded-full object-cover ring-1 ring-white dark:ring-black"
                          />
                        </div>
                      );
                    }

                    // "Đã gửi" — chỉ hiện dưới tin nhắn cuối của mình (nếu chưa được xem)
                    if (index === lastMyMessageIndex && lastReadByOtherIndex === -1) {
                      return (
                        <div className="flex items-center justify-end gap-1 mt-0.5 pr-0.5">
                          <span className="text-[11px] text-gray-400 font-medium">Đã gửi</span>
                          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
                          </svg>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
