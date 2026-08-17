import { useState, useEffect } from 'react'
import { collection, query as fbQuery, where, orderBy, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase'
import ViewerModal from './ViewerModal'
import { useAuth } from '../contexts/AuthContext'
import { deleteFileFromStorage } from '../services/storageService'

export default function MyCreations({ onBack }) {
  const { user } = useAuth()
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemToDelete, setItemToDelete] = useState(null) // Para el modal de confirmación
  const [viewerItem, setViewerItem] = useState(null) // { modelUrl, prompt }

  useEffect(() => {
    if (!user) return

    const fetchCreations = async () => {
      try {
        const q = fbQuery(
          collection(db, 'creaciones'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setCreations(items)
      } catch (err) {
        console.error('Error al cargar creaciones:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCreations()
  }, [user])

  const togglePublicStatus = async (id, currentPublicStatus) => {
    // Si no tiene el campo (undefined), por defecto lo consideramos público
    const newStatus = currentPublicStatus === false ? true : false
    try {
      await updateDoc(doc(db, 'creaciones', id), {
        public: newStatus
      })
      // Actualizar el estado local
      setCreations(creations.map(c => c.id === id ? { ...c, public: newStatus } : c))
    } catch (err) {
      console.error('Error al actualizar privacidad:', err)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    try {
      // 1. Encontrar la creación para obtener sus URLs de archivos
      const creationToDelete = creations.find(c => c.id === itemToDelete)

      // 2. Borrar documento de Firestore
      await deleteDoc(doc(db, 'creaciones', itemToDelete))
      
      // 3. Si tiene archivos en Storage, borrarlos
      if (creationToDelete) {
        if (creationToDelete.modelUrl) await deleteFileFromStorage(creationToDelete.modelUrl)
        if (creationToDelete.imageUrl) await deleteFileFromStorage(creationToDelete.imageUrl)
      }

      // Actualizar la lista local quitando el borrado
      setCreations(creations.filter(c => c.id !== itemToDelete))
      setItemToDelete(null)
    } catch (err) {
      console.error('Error al borrar creación:', err)
      alert(`Hubo un error al intentar borrar la creación: ${err.message}`)
    }
  }

  return (
    <>
    <div className="my-creations">
      {/* ── Cabecera ── */}
      <div className="profile-header" style={{ justifyContent: 'center' }}>
        <h2 className="profile-title">Tus Creaciones</h2>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="creations-loading">
          <span className="spinner" />
          <p className="creations-loading-text">Cargando tus creaciones...</p>
        </div>
      ) : creations.length === 0 ? (
        <div className="creations-empty">
          <p className="creations-empty-icon">📦</p>
          <p className="creations-empty-title">Aún no tienes creaciones</p>
          <p className="creations-empty-text">
            Vuelve a la pantalla principal y genera tu primera maqueta 3D
          </p>
        </div>
      ) : (
        <div className="creations-list">
          {creations.map((c) => (
            <div key={c.id} className="creation-card card" style={{ position: 'relative' }}>

              {/* ── Botón de Borrar (Esquina sup. derecha) ── */}
              <button
                onClick={() => setItemToDelete(c.id)}
                className="btn-delete-creation"
                title="Borrar creación"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>

              <div className="creation-info">
                <h3 className="creation-title">{c.prompt}</h3>
                <p className="creation-date">
                  {new Date(c.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {c.imageUrl && (
                <div className="creation-image-wrapper">
                  <img src={c.imageUrl} alt={c.prompt} className="creation-image" />
                </div>
              )}
              <div className="creation-actions-wrapper">
                <button
                  className="creation-view-3d"
                  onClick={() => setViewerItem({ modelUrl: c.modelUrl, prompt: c.prompt })}
                  disabled={!c.modelUrl}
                >
                  Ver en 3D
                </button>
                <div className="creation-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <button
                    className={`btn-visibility`}
                    onClick={() => togglePublicStatus(c.id, c.public)}
                    title={c.public === false ? "Privado (Solo tú puedes verlo)" : "Público (Visible en la Galería)"}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: c.public === false ? '#999' : 'var(--orange)',
                      opacity: c.public === false ? 0.4 : 1,
                      transition: 'opacity 0.2s',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {c.public === false ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                  <a
                    href={c.modelUrl}
                    className="creation-download"
                    download
                    target="_blank"
                    rel="noreferrer"
                  >
                    Descargar modelo
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal de Confirmación de Borrado ── */}
      {itemToDelete && (
        <div className="gen-overlay" onClick={() => setItemToDelete(null)}>
          <div className="gen-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', height: 'auto', minHeight: 'auto' }}>
            <button className="gen-modal-close" onClick={() => setItemToDelete(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="gen-modal-body" style={{ textAlign: 'center', padding: '30px', paddingBottom: '25px' }}>
              <h3 className="gen-modal-wait-title" style={{ color: '#c0392b', marginBottom: '15px' }}>¿Eliminar creación?</h3>
              <p className="gen-modal-wait-text" style={{ marginBottom: '30px' }}>
                Esta acción no se puede deshacer.<br />
                Se eliminará el modelo permanentemente.
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={() => setItemToDelete(null)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '12px', fontFamily: 'var(--font-heading)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                  Cancelar
                </button>
                <button onClick={handleDelete} style={{ flex: 1, padding: '12px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '12px', fontFamily: 'var(--font-heading)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(192, 57, 43, 0.2)' }}>
                  Borrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ── Visor 3D ── */}
    {viewerItem && (
      <ViewerModal
        modelUrl={viewerItem.modelUrl}
        title={viewerItem.prompt}
        onClose={() => setViewerItem(null)}
      />
    )}
    </>
  )
}
