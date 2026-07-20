/**
 * ViewerModal.jsx
 * Modal reutilizable que envuelve al ModelViewer3D.
 * Sigue el mismo diseño (gen-overlay / gen-modal) del resto de la app.
 */

import ModelViewer3D from './ModelViewer3D'

export default function ViewerModal({ modelUrl, title, onClose }) {
  if (!modelUrl) return null

  return (
    <div className="gen-overlay" onClick={onClose}>
      <div
        className="gen-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '70vw', maxWidth: '900px', height: '80vh', maxHeight: '700px', overflow: 'hidden' }}
      >
        {/* Botón cerrar */}
        <button className="gen-modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Cabecera */}
        <div style={{ padding: '24px 40px 0', flexShrink: 0 }}>
          <p style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--orange)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
          }}>
            Visualizador 3D
          </p>
          {title && (
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#222',
              margin: '4px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {title}
            </h3>
          )}
        </div>

        {/* Visor 3D */}
        <div className="gen-modal-body" style={{ padding: '20px 24px 24px', position: 'relative' }}>
          <ModelViewer3D modelUrl={modelUrl} style={{ height: '100%', minHeight: '0' }} />
        </div>
      </div>
    </div>
  )
}
