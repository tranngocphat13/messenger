import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()


  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-xl font-bold text-blue-600">Messenger</h1>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold">{profile?.full_name || 'Người dùng'}</p>
            <p className="text-xs text-green-500">Đang hoạt động</p>
          </div>
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Chào mừng trở lại!</h2>
          <p className="text-gray-500 mt-2">Hãy bắt đầu một cuộc trò chuyện mới.</p>
        </div>
      </main>
    </div>
  )
}
