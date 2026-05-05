'use client'

import React from 'react'
import { Search, Settings, SquarePen, MessageCircle, Users, Archive, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const conversations = [
  { id: 1, name: 'Trần Ngọc Phát', lastMsg: 'Chào bạn, dự án thế nào rồi?', time: '10:30 AM', online: true, unread: 0 },
  { id: 2, name: 'Lê Văn Tám', lastMsg: 'Bạn có rảnh lúc 2h không?', time: '9:45 AM', online: false, unread: 2 },
  { id: 3, name: 'Nguyễn Thị Bưởi', lastMsg: 'Gửi mình tài liệu nhé.', time: 'Hôm qua', online: true, unread: 0 },
  { id: 4, name: 'Đặng Trần Côn', lastMsg: 'Cảm ơn bạn nhiều!', time: 'Thứ 2', online: false, unread: 0 },
]

const navItems = [
  { icon: MessageCircle, label: 'Đoạn chat', active: true },
  { icon: Users, label: 'Mọi người', active: false },
  { icon: Archive, label: 'Kho lưu trữ', active: false },
]

export default function Sidebar() {
  return (
    <div className="flex h-full w-[420px] bg-white dark:bg-black">
      {/* Left Navigation Rail (Premium addition) */}
      <div className="w-[72px] h-full flex flex-col items-center py-6 gap-4 bg-white dark:bg-[#000000] border-r border-gray-50 dark:border-gray-900">
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button className={`p-3 rounded-2xl transition-all ${item.active ? 'bg-[#004db0]/10 text-[#004db0]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900'}`}>
                  <item.icon className="w-6 h-6" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Avatar className="w-10 h-10 ring-2 ring-transparent hover:ring-blue-500 transition-all cursor-pointer">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </div>

      {/* Main Sidebar Area */}
      <div className="flex-1 flex flex-col bg-[#f9f9fd] dark:bg-[#0c0c0d]">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1c1f] dark:text-white">Đoạn chat</h1>
            <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-[#1c1c1d] shadow-sm hover:scale-105 transition-all">
              <SquarePen className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </Button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#004db0] transition-colors" />
            <Input 
              placeholder="Tìm kiếm trên Messenger" 
              className="pl-10 bg-[#f3f3f7] dark:bg-[#1c1c1d] border-none rounded-xl h-11 focus-visible:ring-2 focus-visible:ring-[#004db0]/20 placeholder:text-gray-400 text-[14px]"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-4">
            {conversations.map((chat) => (
              <div 
                key={chat.id} 
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white dark:hover:bg-[#1c1c1d] hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer transition-all group"
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="w-14 h-14 ring-2 ring-transparent group-hover:ring-white transition-all">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} />
                    <AvatarFallback className="bg-[#004db0] text-white font-bold">{chat.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#31a24c] border-[3px] border-[#f9f9fd] dark:border-[#0c0c0d] group-hover:border-white dark:group-hover:border-[#1c1c1d] rounded-full transition-all" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-[15px] text-[#1a1c1f] dark:text-white truncate tracking-tight">{chat.name}</span>
                    <span className="text-[12px] text-gray-400 font-medium">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-[13.5px] truncate flex-1 ${chat.unread > 0 ? 'text-[#1a1c1f] dark:text-white font-extrabold' : 'text-gray-500 font-medium'}`}>
                      {chat.lastMsg}
                    </p>
                    {chat.unread > 0 && (
                      <div className="min-w-[18px] h-[18px] bg-[#004db0] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
