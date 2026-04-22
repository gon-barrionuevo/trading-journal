'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function Register() {
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
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface border border-border2 rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✉️</div>
          <div className="text-lg font-semibold mb-2">Revisá tu email</div>
          <div className="text-sm text-muted leading-relaxed">
            Te enviamos un link de confirmación a <strong className="text-text">{email}</strong>.
            Hacé clic en el link para activar tu cuenta.
          </div>
          <Link href="/login">
            <button className="btn btn-ghost mt-6 w-full justify-center">
              Volver al login
            </button>
          </Link>
        </div>
      </div>
    )
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

        <div className="bg-surface border border-border2 rounded-2xl p-8">
          <div className="text-lg font-semibold mb-6">Crear cuenta</div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted font-medium">Nombre</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-accent2 no-underline font-medium">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
