'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const validate = () => {
    if (!fullName.trim()) return 'Vui lòng nhập tên hiển thị.'
    if (fullName.trim().length < 2) return 'Tên phải có ít nhất 2 ký tự.'
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp.'
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Nếu user đã được tạo ngay (no email confirmation needed), upsert profile
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        email: email.toLowerCase(),
        is_online: false,
        updated_at: new Date().toISOString(),
      })
    }

    setSuccess(true)
    setLoading(false)

    // Nếu không cần xác nhận email, chuyển thẳng sang /chat
    if (data.session) {
      setTimeout(() => router.push('/chat'), 1200)
    }
  }

  const passwordStrength = (() => {
    if (!password) return null
    if (password.length < 8) return { level: 1, label: 'Yếu', color: '#ef4444' }
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 10)
      return { level: 3, label: 'Mạnh', color: '#22c55e' }
    return { level: 2, label: 'Trung bình', color: '#f59e0b' }
  })()

  return (
    <div className="flex h-screen items-center justify-center bg-[#f9f9fd] dark:bg-black px-4 py-8">
      <div className="w-full max-w-[440px] p-10 bg-white dark:bg-[#1c1c1d] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#004db0] to-[#0064e0] rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current">
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.463 5.503 3.753 7.258V22l3.309-1.817c.905.251 1.868.39 2.868.39 5.523 0 10-4.145 10-9.258S17.523 2 12 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1c1f] dark:text-white mb-1">
            Tạo tài khoản
          </h1>
          <p className="text-gray-500 text-sm text-center">
            Bắt đầu nhắn tin với bạn bè và đồng nghiệp
          </p>
        </div>

        {/* Success state */}
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1a1c1f] dark:text-white mb-2">Đăng ký thành công!</h2>
            <p className="text-gray-500 text-sm">
              Vui lòng kiểm tra email để xác nhận tài khoản, hoặc đang chuyển hướng...
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-[#004db0] dark:text-[#5b9cf6] text-sm font-semibold hover:underline"
            >
              Về trang đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Tên hiển thị
              </label>
              <input
                id="register-fullname"
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3.5 bg-[#f3f3f7] dark:bg-[#2c2c2e] border-none rounded-xl focus:ring-2 focus:ring-[#004db0] transition-all outline-none text-[15px] placeholder-gray-400"
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 bg-[#f3f3f7] dark:bg-[#2c2c2e] border-none rounded-xl focus:ring-2 focus:ring-[#004db0] transition-all outline-none text-[15px] placeholder-gray-400"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 pr-12 bg-[#f3f3f7] dark:bg-[#2c2c2e] border-none rounded-xl focus:ring-2 focus:ring-[#004db0] transition-all outline-none text-[15px] placeholder-gray-400"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                  aria-label="Hiện/ẩn mật khẩu"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password strength bar */}
              {passwordStrength && (
                <div className="px-1 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= passwordStrength.level ? passwordStrength.color : '#e5e7eb',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3.5 pr-12 bg-[#f3f3f7] dark:bg-[#2c2c2e] border-none rounded-xl focus:ring-2 focus:ring-[#004db0] transition-all outline-none text-[15px] placeholder-gray-400"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                  aria-label="Hiện/ẩn xác nhận mật khẩu"
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Match indicator */}
              {confirmPassword && (
                <p
                  className={`text-[11px] font-medium px-1 transition-colors ${
                    password === confirmPassword ? 'text-green-500' : 'text-red-400'
                  }`}
                >
                  {password === confirmPassword ? '✓ Mật khẩu khớp' : '✗ Chưa khớp'}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-xl">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-[13px] text-red-600 dark:text-red-400 leading-snug">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-[#004db0] text-white p-4 rounded-xl font-bold hover:bg-[#003782] active:scale-[0.98] transition-all duration-200 disabled:bg-gray-300 dark:disabled:bg-gray-700 shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Đang tạo tài khoản...
                  </>
                ) : (
                  'Tạo tài khoản'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-7 pt-7 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-[13px] text-gray-500">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-[#004db0] dark:text-[#5b9cf6] font-semibold hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
