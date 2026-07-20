import { useState } from 'react'
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'

export default function ProfileSettings({ onBack }) {
  const { user, dbUsername, setDbUsername, logout } = useAuth();
  
  // ── Nombre de usuario ──
  const [newUsername, setNewUsername] = useState(dbUsername || user.displayName || '')
  const [usernameMsg, setUsernameMsg] = useState(null)
  const [usernameSaving, setUsernameSaving] = useState(false)

  // ── Contraseña ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // ── Borrar cuenta ──
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMsg, setDeleteMsg] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ════════════════════════════════════════════
  //  CAMBIAR NOMBRE DE USUARIO
  // ════════════════════════════════════════════
  const handleChangeUsername = async (e) => {
    e.preventDefault()
    setUsernameMsg(null)

    const trimmed = newUsername.trim()
    if (!trimmed) {
      setUsernameMsg({ type: 'error', text: 'El nombre no puede estar vacío.' })
      return
    }

    setUsernameSaving(true)
    try {
      // 1. Actualizar en Firebase Auth (displayName)
      await updateProfile(user, { displayName: trimmed })

      // 2. Actualizar en Firestore
      const userRef = doc(db, 'usuarios', user.uid)
      await updateDoc(userRef, { username: trimmed })

      setUsernameMsg({ type: 'success', text: '¡Nombre actualizado correctamente!' })
      setDbUsername(trimmed)
    } catch (err) {
      console.error('Error al cambiar nombre:', err)
      setUsernameMsg({ type: 'error', text: 'Error al guardar. Inténtalo de nuevo.' })
    } finally {
      setUsernameSaving(false)
    }
  }

  // ════════════════════════════════════════════
  //  CAMBIAR CONTRASEÑA
  // ════════════════════════════════════════════
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }

    setPasswordSaving(true)
    try {
      // Re-autenticar al usuario antes de cambiar la contraseña
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      await updatePassword(user, newPassword)
      setPasswordMsg({ type: 'success', text: '¡Contraseña actualizada correctamente!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Error al cambiar contraseña:', err)
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordMsg({ type: 'error', text: 'La contraseña actual es incorrecta.' })
      } else {
        setPasswordMsg({ type: 'error', text: 'Error al cambiar la contraseña. Inténtalo de nuevo.' })
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  // ════════════════════════════════════════════
  //  BORRAR CUENTA
  // ════════════════════════════════════════════
  const handleDeleteAccount = async () => {
    setDeleteMsg(null)

    if (!deletePassword) {
      setDeleteMsg({ type: 'error', text: 'Introduce tu contraseña para confirmar.' })
      return
    }

    setDeleting(true)
    try {
      // Re-autenticar
      const credential = EmailAuthProvider.credential(user.email, deletePassword)
      await reauthenticateWithCredential(user, credential)

      // Borrar documento de Firestore
      await deleteDoc(doc(db, 'usuarios', user.uid))

      // Borrar cuenta de Firebase Auth
      await deleteUser(user)

      logout()
    } catch (err) {
      console.error('Error al borrar cuenta:', err)
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setDeleteMsg({ type: 'error', text: 'Contraseña incorrecta.' })
      } else {
        setDeleteMsg({ type: 'error', text: 'Error al eliminar la cuenta. Inténtalo de nuevo.' })
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="profile-settings">
      {/* ── Cabecera ── */}
      <div className="profile-header">
        <button className="profile-back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </button>
        <h2 className="profile-title">Configurar perfil</h2>
      </div>

      {/* ── Sección: Nombre de usuario ── */}
      <form className="profile-section" onSubmit={handleChangeUsername}>
        <h3 className="profile-section-title">Nombre de usuario</h3>
        <div className="profile-field-row">
          <input
            type="text"
            className="profile-input"
            placeholder="Nuevo nombre de usuario"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button type="submit" className="profile-btn profile-btn--save" disabled={usernameSaving}>
            {usernameSaving ? <span className="auth-spinner" /> : 'Guardar'}
          </button>
        </div>
        {usernameMsg && (
          <p className={`profile-msg profile-msg--${usernameMsg.type}`}>{usernameMsg.text}</p>
        )}
      </form>

      {/* ── Sección: Contraseña ── */}
      <form className="profile-section" onSubmit={handleChangePassword}>
        <h3 className="profile-section-title">Cambiar contraseña</h3>
        <input
          type="password"
          className="profile-input"
          placeholder="Contraseña actual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="profile-input"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="profile-input"
          placeholder="Repetir nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" className="profile-btn profile-btn--save" disabled={passwordSaving}>
          {passwordSaving ? <span className="auth-spinner" /> : 'Cambiar contraseña'}
        </button>
        {passwordMsg && (
          <p className={`profile-msg profile-msg--${passwordMsg.type}`}>{passwordMsg.text}</p>
        )}
      </form>

      {/* ── Sección: Eliminar cuenta ── */}
      <div className="profile-section profile-section--danger">
        <h3 className="profile-section-title profile-section-title--danger">Eliminar cuenta</h3>
        <p className="profile-danger-warning">
          Esta acción es irreversible. Se borrarán todos tus datos y creaciones permanentemente.
        </p>

        {!deleteConfirm ? (
          <button
            type="button"
            className="profile-btn profile-btn--danger"
            onClick={() => setDeleteConfirm(true)}
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <>
            <input
              type="password"
              className="profile-input"
              placeholder="Confirma tu contraseña"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <div className="profile-field-row">
              <button
                type="button"
                className="profile-btn profile-btn--cancel"
                onClick={() => { setDeleteConfirm(false); setDeletePassword(''); setDeleteMsg(null) }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="profile-btn profile-btn--danger-confirm"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? <span className="auth-spinner" /> : 'Confirmar eliminación'}
              </button>
            </div>
          </>
        )}

        {deleteMsg && (
          <p className={`profile-msg profile-msg--${deleteMsg.type}`}>{deleteMsg.text}</p>
        )}
      </div>
    </div>
  )
}
