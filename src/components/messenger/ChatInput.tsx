'use client'

import React, { useState, useCallback } from 'react';
import { PlusCircle, Image, Sticker, Smile, Send, ThumbsUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { chatService } from '@/services/chatService';
import { conversationService } from '@/services/conversationService';
import { useChatStore } from '@/store/useChatStore';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import debounce from 'lodash/debounce';

interface ChatInputProps {
  currentUser: any;
  activeConversationId: string;
  isFriend?: boolean;
}

export default function ChatInput({ currentUser, activeConversationId, isFriend = true }: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  
  const { sendTypingStatus } = useChatRealtime(activeConversationId);

  // Debounced function để gửi tín hiệu typing
  const debouncedTyping = useCallback(
    debounce((isTyping: boolean) => {
      sendTypingStatus(currentUser.id, isTyping);
    }, 500),
    [activeConversationId, currentUser.id]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) {
      debouncedTyping(true);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    debouncedTyping(false);

    // 1. Optimistic UI: Thêm tin nhắn tạm thời vào store
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      text: text,
      sender_id: currentUser.id,
      conversation_id: activeConversationId,
      created_at: new Date().toISOString(),
      status: 'sending' as const,
      is_read: false,
      read_at: null,
      delivered_at: null,
      file_url: null,
      type: 'text' as const,
      call_duration: null
    };

    addMessage(tempMessage);

    // 2. Gửi tin nhắn thực tế qua API
    let finalConvId = activeConversationId;
    let newConvData = null;
    
    // Nếu là hội thoại mới, ta cần tạo nó trong DB trước
    if (activeConversationId.startsWith('new:')) {
      const otherUserId = activeConversationId.split(':')[1];
      const { data: newConv, error: cError } = await conversationService.createConversation(otherUserId);
      
      if (cError || !newConv) {
        console.error('Failed to create conversation:', cError);
        updateMessage(tempId, { status: 'error' });
        return;
      }
      
      finalConvId = newConv.id;
      newConvData = newConv;
    }

    const { data, error } = await chatService.sendMessage(text, finalConvId, currentUser.id);

    if (error) {
      console.error('Failed to send message:', error);
      updateMessage(tempId, { status: 'error' });
    } else if (data) {
      // 3. Cập nhật tin nhắn trong store với dữ liệu thực từ server
      updateMessage(tempId, { ...data, status: 'sent' });
      
      // Nếu là hội thoại mới, cập nhật ID vào store SAU KHI tin nhắn đã gửi thành công
      if (newConvData) {
        useChatStore.getState().setActiveConversationId(newConvData.id);
      }
    }
  };

  return (
    <footer className="p-6 pt-2 bg-white dark:bg-black">
      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <div className="flex gap-1">
            {[PlusCircle, Image, Sticker].map((Icon, i) => (
              <Button key={i} type="button" variant="ghost" size="icon" className="text-[#004db0] rounded-full shrink-0 hover:bg-[#004db0]/5 transition-all">
                <Icon className="w-6 h-6" />
              </Button>
            ))}
          </div>
          
          <div className="relative flex-1 group">
            <Input 
              placeholder="Aa" 
              value={inputText}
              onChange={handleChange}
              className="bg-[#f3f3f7] dark:bg-[#1c1c1d] border-none rounded-[20px] h-11 focus-visible:ring-2 focus-visible:ring-[#004db0]/10 pr-12 text-[15px] transition-all"
            />
            <Smile className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#004db0] cursor-pointer hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
          </div>

          <Button 
            type="submit"
            variant="ghost" 
            size="icon" 
            className="text-[#004db0] rounded-full shrink-0 hover:bg-[#004db0]/5 transition-all active:scale-90"
          >
            {inputText.trim() ? (
              <Send className="w-6 h-6 fill-current" />
            ) : (
              <ThumbsUp className="w-6 h-6 fill-current" />
            )}
          </Button>
        </form>
    </footer>
  );
}
