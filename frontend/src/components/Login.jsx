import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../config/firebase'

export default function Login({ onSwitchToRegister, onSuccess }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      onSuccess?.()
    } catch (err) {
      setError(mapFirebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card card">
      <div className="auth-card__header">
        <h2 className="register-title">Inicia Sesión</h2>
        <p className="register-subtitle">
          Bienvenido de nuevo
        </p>
      </div>

      <form className="auth-form" onSubmit={handleLogin}>
        <input
          id="login-email"
          type="email"
          className="register-input"
          placeholder="correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          id="login-password"
          type="password"
          className="register-input"
          placeholder="contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn-register" disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'Entrar'}
        </button>
      </form>

      <p className="auth-switch">
        ¿No tienes cuenta?{' '}
        <button type="button" className="auth-link" onClick={onSwitchToRegister}>
          Regístrate
        </button>
      </p>
    </div>
  )
}

// ── Traducciones de errores Firebase ──────────────────
function mapFirebaseError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':  return 'Correo o contraseña incorrectos.'
    case 'auth/invalid-email':       return 'El correo no tiene un formato válido.'
    case 'auth/too-many-requests':   return 'Demasiados intentos. Inténtalo más tarde.'
    default:                         return 'Ha ocurrido un error. Inténtalo de nuevo.'
  }
}
