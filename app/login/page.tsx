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
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, background: 'var(--accent)',
            borderRadius: 12, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 20, color: '#fff',
            marginBottom: 16,
          }}>Tf</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Tradefolio</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Trading Journal</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 16, padding: 32,
        }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 24 }}>Iniciar sesión</div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Email</label>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Contraseña</label>
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
              <div style={{
                background: 'var(--red-bg)',
                border: '1px solid rgba(255,77,109,0.3)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: 'var(--red)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            ¿No tenés cuenta?{' '}
            <Link href="/register" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 500 }}>
              Registrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
