'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-accent rounded-xl inline-flex items-center justify-center font-bold text-xl text-white mb-4">Tf</div>
          <div className="text-2xl font-semibold text-text">Tradefolio</div>
          <div className="text-sm text-muted mt-1">Trading Journal</div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border2 rounded-2xl p-8">
          <div className="text-lg font-semibold mb-6">Iniciar sesión</div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Contraseña</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-bg border border-red/30 rounded-sm px-3.5 py-2.5 text-sm text-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full justify-center mt-1"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-accent2 no-underline font-medium">
              Registrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
