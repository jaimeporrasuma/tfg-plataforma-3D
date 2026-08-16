import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

export default function Register({ onSwitchToLogin, onSuccess }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (!username.trim()) {
      setError('El nombre de usuario es obligatorio.')
      return
    }

    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Asignar el nombre al perfil de sesión
      await updateProfile(user, { displayName: username.trim() })
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        username: username.trim(),
        email: user.email,
        createdAt: new Date().toISOString(),
      })
      onSuccess?.()
    } catch (err) {
      console.error('🔴 Firebase error code:', err.code, err.message)
      setError(mapFirebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card card">
      <div className="auth-card__header">
        <h2 className="register-title">Regístrate</h2>
        <p className="register-subtitle">
          Y obtén tu maqueta <strong>gratis</strong>
        </p>
      </div>

      <form className="auth-form" onSubmit={handleRegister}>
        <input
          id="reg-username"
          type="text"
          className="register-input"
          placeholder="nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          id="reg-email"
          type="email"
          className="register-input"
          placeholder="correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          id="reg-password"
          type="password"
          className="register-input"
          placeholder="contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn-register" disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'Registrarse'}
        </button>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta?{' '}
        <button type="button" className="auth-link" onClick={onSwitchToLogin}>
          Inicia sesión
        </button>
      </p>
    </div>
  )
}

// ── Traducciones de errores Firebase ──────────────────
function mapFirebaseError(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'Este correo ya está registrado.'
    case 'auth/invalid-email': return 'El correo no tiene un formato válido.'
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/operation-not-allowed': return 'El registro por email no está habilitado en Firebase. Actívalo en la consola.'
    case 'auth/network-request-failed': return 'Error de red. Comprueba tu conexión a internet.'
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
    case 'auth/internal-error': return 'Error interno de Firebase. Inténtalo de nuevo.'
    default: return `Error inesperado (${code}). Revisa la consola.`
  }
}
