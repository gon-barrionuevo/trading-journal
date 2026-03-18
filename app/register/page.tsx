'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function Register() {
  const router   = useRouter()
  const supabase = createClient()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 16, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>✉️</div>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Revisá tu email</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Te enviamos un link de confirmación a <strong style={{ color: 'var(--text)' }}>{email}</strong>.
            Hacé clic en el link para activar tu cuenta.
          </div>
          <Link href="/login">
            <button className="btn btn-ghost" style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
              Volver al login
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, background: 'var(--accent)',
            borderRadius: 12, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 16,
          }}>Tr</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>TrackR</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Trading Journal</div>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 16, padding: 32,
        }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 24 }}>Crear cuenta</div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Nombre</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--red-bg)', border: '1px solid rgba(255,77,109,0.3)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)',
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 500 }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
