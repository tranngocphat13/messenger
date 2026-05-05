'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Phone, Video, Info, PlusCircle, Image, Sticker, Gift, ThumbsUp, Smile, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'

interface Message {
  id: string
  text: string
  sender_id: string
  created_at: string
}

export default function ChatWindow({ currentUser, profile }: { currentUser: any, profile: any }) {
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const { error } = await supabase.from('messages').insert([
      {
        text: inputText,
        sender_id: currentUser.id,
        conversation_id: 'd9e2e980-4b8b-46b8-97df-a26a2d94460b' // Placeholder or selected conv ID
      }
    ])

    if (error) {
      console.error('Error sending message:', error)
    } else {
      setInputText('')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#000000]">
      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-50 dark:border-gray-900">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-11 h-11 ring-2 ring-transparent hover:ring-[#004db0] transition-all cursor-pointer">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Trần Ngọc Phát" />
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#31a24c] border-2 border-white dark:border-black rounded-full" />
          </div>
          <div>
            <h2 className="font-extrabold text-[16px] leading-tight text-[#1a1c1f] dark:text-white cursor-pointer hover:underline underline-offset-2">Trần Ngọc Phát</h2>
            <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider">Đang hoạt động</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[Phone, Video, Info].map((Icon, i) => (
            <Button key={i} variant="ghost" size="icon" className="text-[#004db0] hover:bg-[#004db0]/5 dark:hover:bg-[#1c1c1d] rounded-full w-10 h-10 transition-all active:scale-90">
              <Icon className="w-5 h-5 fill-current" />
            </Button>
          ))}
        </div>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-6 bg-[#f9f9fd]/30 dark:bg-[#000000]">
        <div className="flex flex-col py-6">
          <div className="text-center py-12 mb-8">
            <Avatar className="w-28 h-28 mx-auto mb-6 shadow-2xl shadow-blue-500/10 ring-4 ring-white dark:ring-[#1c1c1d]">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Trần Ngọc Phát" />
            </Avatar>
            <h3 className="font-extrabold text-2xl text-[#1a1c1f] dark:text-white tracking-tight">Trần Ngọc Phát</h3>
            <p className="text-[14px] text-gray-500 mt-2 font-medium">Chuyên gia thiết kế giao diện tại Meta</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" className="rounded-full h-8 text-[12px] font-bold border-gray-200">Trang cá nhân</Button>
            </div>
          </div>

          <div className="space-y-1.5">
            {messages.map((msg, index) => {
              const isMine = msg.sender_id === currentUser.id
              const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender_id !== msg.sender_id
              
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
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={scrollRef} />
          </div>
        </div>
      </div>

      {/* Input Bar */}
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
              onChange={(e) => setInputText(e.target.value)}
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
    </div>
  )
}
