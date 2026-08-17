import { useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { generarMaqueta3D } from './services/apiService'

import Navbar from './components/Navbar'
import Home from './components/Home'
import ProfileSettings from './components/ProfileSettings'
import MyCreations from './components/MyCreations'
import Gallery from './components/Gallery'
import AdminGallery from './components/AdminGallery'
import ViewerModal from './components/ViewerModal'
import './App.css'

function App() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [referenceImage, setReferenceImage] = useState(null)

  //Estados de la generación 3D
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [viewer3DUrl, setViewer3DUrl] = useState(null)

  //Auth View (login/register/none modals in Home)
  const [authView, setAuthView] = useState('none')
  
  const location = useLocation()
  const navigate = useNavigate()

  const AuthRequiredMessage = () => {
    const isDeleted = location.state?.accountDeleted;
    return (
      <div style={{ textAlign: 'center', marginTop: '6rem', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ marginBottom: '2rem', fontWeight: 500, fontSize: '1.8rem', fontFamily: 'var(--font-heading)' }}>
          {isDeleted ? "Cuenta eliminada correctamente" : "Debes iniciar sesión"}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <button 
            style={{ 
              background: 'var(--orange, #e65c00)', 
              color: 'white', 
              padding: '10px 24px', 
              borderRadius: '112px', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '18px', 
              fontWeight: 600, 
              fontFamily: 'var(--font-heading)' 
            }} 
            onClick={() => { setAuthView('login'); navigate('/'); }}
          >
            Iniciar sesión
          </button>
          <span style={{ fontSize: '1.2rem', opacity: 0.8, fontFamily: 'var(--font-heading)' }}>o</span>
          <button 
            style={{ 
              background: 'white', 
              color: 'var(--orange, #e65c00)', 
              padding: '10px 24px', 
              borderRadius: '112px', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '18px', 
              fontWeight: 600, 
              fontFamily: 'var(--font-heading)' 
            }} 
            onClick={() => { setAuthView('register'); navigate('/'); }}
          >
            Registrarse
          </button>
        </div>
      </div>
    )
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar formato (solo permitimos JPG y PNG)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, selecciona una imagen en formato JPG o PNG.')
      e.target.value = '' // Limpiar el input
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64Full = reader.result
      const base64Data = base64Full.split(',')[1]
      setReferenceImage({ file, preview: base64Full, base64: base64Data })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => setReferenceImage(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    if (!user) {
      setError('Es necesario registrarse o iniciar sesión para generar maquetas.')
      if (authView === 'none') setAuthView('register')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)
    setShowModal(true)

    try {
      const data = await generarMaqueta3D(query, user, referenceImage ? referenceImage.base64 : null)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-wrapper">
        <section className="hero-section">
          <Navbar authView={authView} setAuthView={setAuthView} />

          <Routes>
            <Route path="/" element={
              <Home
                authView={authView} setAuthView={setAuthView}
                query={query} setQuery={setQuery}
                referenceImage={referenceImage} handleImageSelect={handleImageSelect}
                handleRemoveImage={handleRemoveImage} handleSearch={handleSearch}
                loading={loading} error={error} showModal={showModal}
                setShowModal={setShowModal} result={result}
              />
            } />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/creaciones" element={
              user ? <MyCreations /> : <AuthRequiredMessage />
            } />
            <Route path="/admin" element={
              user ? <AdminGallery /> : <AuthRequiredMessage />
            } />
            <Route path="/perfil" element={
              user ? <ProfileSettings /> : <AuthRequiredMessage />
            } />
          </Routes>
        </section>
      </div>

      {/* ── MODAL DE GENERACIÓN ── */}
      {showModal && (
        <div className="gen-overlay" onClick={() => { setShowModal(false); }}>
          <div className="gen-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gen-modal-close" onClick={() => { setShowModal(false); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="gen-modal-body">
              {loading && (
                <div className="gen-modal-loading">
                  <span className="spinner gen-spinner" />
                  <p className="gen-modal-wait-title">Generando tu maqueta...</p>
                  <p className="gen-modal-wait-text">
                    Espera mientras se genera tu maqueta,<br />
                    este proceso puede tardar 10-20 minutos.
                  </p>
                </div>
              )}

                {error && !loading && (
                  <div className="gen-modal-error">
                    <p className="gen-modal-error-icon">⚠️</p>
                    <p className="gen-modal-error-text">Ha ocurrido un error. Vuelve a intentarlo más tarde.</p>
                  </div>
                )}

                {result && !loading && (
                  <div className="gen-modal-result">
                    <p className="gen-modal-success-title">TuMaqueta ha sido generada con éxito.</p>
                    {result.imageUrl && <img src={result.imageUrl} alt="Concepto generado" className="gen-modal-image" />}

                    <div className="gen-modal-result-actions">
                      {result.model3DUrl && (
                        <button className="creation-view-3d" onClick={() => setViewer3DUrl(result.model3DUrl)}>
                          Ver en 3D
                        </button>
                      )}
                      {result.model3DUrl && (
                        <a href={result.model3DUrl} className="btn-download gen-modal-download" download target="_blank" rel="noreferrer">
                          Descargar modelo
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}

      {/* ── VISOR 3D ── */}
      {viewer3DUrl && (
        <ViewerModal
          modelUrl={viewer3DUrl}
          title={result?.prompt || query}
          onClose={() => setViewer3DUrl(null)}
        />
      )}
    </>
  )
}

export default App
