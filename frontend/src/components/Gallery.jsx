import { useState, useEffect } from 'react'
import { collection, query as fbQuery, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import ViewerModal from './ViewerModal'
import ScrollingTitle from './ScrollingTitle'

export default function Gallery() {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewerItem, setViewerItem] = useState(null) // { modelUrl, prompt }

  useEffect(() => {
    const fetchCreations = async () => {
      try {
        const q = fbQuery(
          collection(db, 'creaciones'),
          orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setCreations(items)
      } catch (err) {
        console.error('Error al cargar creaciones para la galería:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCreations()
  }, [])

  const filteredCreations = creations.filter(c =>
    (c.prompt || '').toLowerCase().includes(searchQuery.toLowerCase()) && c.public !== false
  )

  return (
    <>
    <div className="my-creations">
      {/* ── Cabecera ── */}
      <div className="profile-header" style={{ justifyContent: 'center' }}>
        <h2 className="profile-title">Galería</h2>
      </div>

      {/* ── Buscador ── */}
      <div className="gallery-search-container">
        <input
          type="text"
          className="gallery-search-input"
          placeholder="Buscar por nombre o monumento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="creations-loading">
          <span className="spinner" />
          <p className="creations-loading-text">Cargando la galería...</p>
        </div>
      ) : filteredCreations.length === 0 ? (
        <div className="creations-empty">
          <p className="creations-empty-icon">🌍</p>
          <p className="creations-empty-title">
            {creations.length === 0 ? "Aún no hay creaciones en la comunidad" : "No se encontraron resultados"}
          </p>
          <p className="creations-empty-text">
            {creations.length === 0 ? "¡Anímate a ser el primero en crear una maqueta!" : "Prueba con otras palabras de búsqueda"}
          </p>
        </div>
      ) : (
        <div className="creations-list">
          {filteredCreations.map((c) => (
            <div key={c.id} className="creation-card card">
              <div className="creation-info">
                <ScrollingTitle title={c.prompt} />
                <div className="creation-meta">
                  <span className="creation-date">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Sin fecha'}
                  </span>
                  <span className="creation-author" title={c.username || 'Anónimo'}>
                    Autor: {c.username || 'Anónimo'}
                  </span>
                </div>
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
                <div className="creation-actions">
                  {c.modelUrl && (
                    <a
                      href={c.modelUrl}
                      className="creation-download"
                      download
                      target="_blank"
                      rel="noreferrer"
                    >
                      Descargar modelo
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
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
