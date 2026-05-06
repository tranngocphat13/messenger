'use client'

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { chatService } from '@/services/chatService';

interface MessageListProps {
  currentUser: any;
  activeConversationId: string;
}

export default function MessageList({ currentUser, activeConversationId }: MessageListProps) {
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch tin nhắn ban đầu
  useEffect(() => {
    const fetchInitialMessages = async () => {
      const { data, error } = await chatService.getMessages(activeConversationId);
      if (data) {
        setMessages(data);
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

                <div className={`max-w-[75%] group relative`}>
                  <div
                    className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm transition-all ${
                      isMine
                        ? 'bg-[#004db0] text-white shadow-blue-500/10'
                        : 'bg-white dark:bg-[#1c1c1d] text-[#1a1c1f] dark:text-white shadow-gray-200/50'
                    } ${
                      isMine
                        ? (isLastInGroup ? 'rounded-[20px] rounded-br-[4px]' : 'rounded-[20px]')
                        : (isLastInGroup ? 'rounded-[20px] rounded-bl-[4px]' : 'rounded-[20px]')
                    } ${msg.status === 'sending' ? 'opacity-70 italic' : ''}`}
                  >
                    {msg.text}
                    {isMine && msg.status === 'sending' && (
                      <span className="text-[10px] block text-right mt-1 opacity-50">Đang gửi...</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
