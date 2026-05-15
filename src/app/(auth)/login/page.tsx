'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Đăng nhập thất bại: ' + error.message)
    } else {
      router.push('/chat')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#f9f9fd] dark:bg-black px-4">
      <div className="w-full max-w-[440px] p-10 bg-white dark:bg-[#1c1c1d] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#004db0] to-[#0064e0] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current">
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.463 5.503 3.753 7.258V22l3.309-1.817c.905.251 1.868.39 2.868.39 5.523 0 10-4.145 10-9.258S17.523 2 12 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1c1f] dark:text-white mb-2">Chào mừng trở lại</h1>
          <p className="text-gray-500 text-sm">Đăng nhập để tiếp tục cuộc trò chuyện</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-3.5 bg-[#f3f3f7] dark:bg-[#2c2c2e] border-none rounded-xl focus:ring-2 focus:ring-[#004db0] transition-all outline-none text-[15px]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">Mật khẩu</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-3.5 bg-[#f3f3f7] dark:bg-[#2c2c2e] border-none rounded-xl focus:ring-2 focus:ring-[#004db0] transition-all outline-none text-[15px]"
              required
            />
          </div>
          
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#004db0] text-white p-4 rounded-xl font-bold hover:bg-[#003782] active:scale-[0.98] transition-all duration-200 disabled:bg-gray-300 shadow-md shadow-blue-500/10"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-[13px] text-gray-500">
            Chưa có tài khoản?{' '}
            <Link
              href="/register"
              className="text-[#004db0] dark:text-[#5b9cf6] font-semibold hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
