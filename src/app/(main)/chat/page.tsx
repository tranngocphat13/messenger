import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/messenger/Sidebar'
import ChatWindow from '@/components/messenger/ChatWindow'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Lấy profile user hiện tại (có thể dùng để hiển thị info cá nhân ở góc hoặc settings)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black overflow-hidden">
      {/* Sidebar - Danh sách đoạn chat */}
      <Sidebar />

      {/* Main Chat Window - Nội dung hội thoại */}
      <ChatWindow currentUser={user} profile={profile} />
    </div>
  )
}
