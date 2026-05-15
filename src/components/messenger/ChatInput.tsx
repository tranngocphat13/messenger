'use client'

import React, { useState, useCallback } from 'react';
import { PlusCircle, Image, Sticker, Smile, Send, ThumbsUp, X } from 'lucide-react';
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
  const replyingToMessage = useChatStore((state) => state.replyingToMessage);
  const setReplyingToMessage = useChatStore((state) => state.setReplyingToMessage);
  
  const { sendTypingStatus } = useChatRealtime(activeConversationId);

  // Debounced function để gửi tín hiệu typing
  const debouncedTyping = useCallback(
    debounce((isTyping: boolean) => {
      sendTypingStatus(currentUser.id, isTyping);
    }, 500),
    [activeConversationId, currentUser.id]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (val.trim()) {
      debouncedTyping(true);
    }
  };

  const isOverLimit = inputText.length > 5000;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isOverLimit) return;

    setInputText('');
    debouncedTyping(false);
    
    const replyToId = replyingToMessage?.id;
    setReplyingToMessage(null);

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
      call_duration: null,
      is_deleted: false,
      metadata: null,
      reply_to_id: replyToId || null
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

    const { data, error } = await chatService.sendMessage(text, finalConvId, currentUser.id, replyToId);

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
    <footer className="p-6 pt-2 bg-white dark:bg-black flex flex-col">
      {replyingToMessage && (
        <div className="flex items-center justify-between bg-black/5 dark:bg-white/10 px-4 py-2 rounded-t-2xl mb-1 text-[13px]">
          <div className="flex flex-col">
            <span className="font-semibold text-[#004db0]">Đang trả lời</span>
            <span className="text-gray-500 truncate max-w-[200px] md:max-w-[400px]">
              {replyingToMessage.is_deleted ? 'Tin nhắn đã bị thu hồi' : replyingToMessage.text}
            </span>
          </div>
          <button onClick={() => setReplyingToMessage(null)} className="p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <div className="flex gap-1">
            {[PlusCircle, Image, Sticker].map((Icon, i) => (
              <Button key={i} type="button" variant="ghost" size="icon" className="text-[#004db0] rounded-full shrink-0 hover:bg-[#004db0]/5 transition-all">
                <Icon className="w-6 h-6" />
              </Button>
            ))}
          </div>
          
          <div className="relative flex-1 group flex flex-col">
            <Input 
              placeholder="Aa" 
              value={inputText}
              onChange={handleChange}
              className={`bg-[#f3f3f7] dark:bg-[#1c1c1d] border-none rounded-[20px] h-11 focus-visible:ring-2 focus-visible:ring-[#004db0]/10 pr-12 text-[15px] transition-all ${isOverLimit ? 'ring-2 ring-red-500' : ''}`}
            />
            <Smile className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#004db0] cursor-pointer hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
            {isOverLimit && (
              <span className="text-[11px] text-red-500 font-bold mt-1 ml-2">
                Tin nhắn quá dài ({inputText.length}/5000)
              </span>
            )}
          </div>

          <Button 
            type="submit"
            variant="ghost" 
            size="icon" 
            disabled={!inputText.trim() || isOverLimit}
            className="text-[#004db0] rounded-full shrink-0 hover:bg-[#004db0]/5 transition-all active:scale-90 disabled:opacity-30 disabled:grayscale"
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
