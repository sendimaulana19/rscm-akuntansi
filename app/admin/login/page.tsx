'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  // Cek jika sudah login, langsung redirect
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/admin/dashboard'
      } else {
        setChecking(false)
      }
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('Email belum dikonfirmasi. Buat ulang akun dan centang "Auto Confirm User".')
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('Email atau password salah.')
        } else {
          setError(`Error: ${authError.message}`)
        }
        setLoading(false)
      } else if (data.session) {
        window.location.href = '/admin/dashboard'
      } else {
        setError('Login gagal. Coba lagi.')
        setLoading(false)
      }
    } catch (err) {
      setError(`Koneksi error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #00282b 0%, #013a3f 60%, #01bcce22 100%)' }}>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'linear-gradient(135deg, #00282b 0%, #013a3f 60%, #01bcce22 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-3xl mb-4"
               style={{ background: 'linear-gradient(135deg, #01bcce, #00282b)' }}>
            ⚕
          </div>
          <h1 className="text-white font-bold text-xl mb-1"
              style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>
            Tim Kerja Akuntansi
          </h1>
          <p className="font-nav text-sm" style={{ color: '#01bcce' }}>
            RSUPN Dr. Cipto Mangunkusumo
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="font-nav font-bold text-xl text-gray-800 mb-1">Masuk Admin</h2>
          <p className="font-nav text-sm text-gray-400 mb-8">Masukkan kredensial akun admin Anda</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="font-nav text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@rscm.co.id"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-nav text-sm outline-none transition-all duration-200"
                style={{ borderColor: '#e5e7eb' }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="font-nav text-xs font-bold text-gray-600 uppercase tracking-wide block mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 font-nav text-sm outline-none transition-all duration-200 pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="font-nav text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-nav font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#00282b', color: 'white' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center font-nav text-xs text-white/30 mt-6">
          Sistem Informasi Internal — Tim Kerja Akuntansi RSCM
        </p>
      </div>
    </div>
  )
}
