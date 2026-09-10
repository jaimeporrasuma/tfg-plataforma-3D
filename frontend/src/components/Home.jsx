import Login from './Login';
import Register from './Register';
import { useAuth } from '../contexts/AuthContext';

export default function Home({
  authView, setAuthView,
  query, setQuery,
  referenceImage, handleImageSelect, handleRemoveImage,
  handleSearch, loading, error, showModal, setShowModal, result
}) {
  const { user } = useAuth();

  return (
    <>
      <div className={`cards-row ${user || authView === 'none' ? 'cards-row--centered' : ''}`}>
        <div className="search-column">
          <div className="card search-card">
            <p className="search-description">
              Crea la maqueta que quieras introduciendo<br />
              el nombre de un monumento.
            </p>
            <form className="search-form" onSubmit={handleSearch}>
              {referenceImage && (
                <div className="search-image-preview">
                  <img src={referenceImage.preview} alt="Referencia" className="search-image-thumb" />
                  <span className="search-image-name">{referenceImage.file.name}</span>
                  <button type="button" className="search-image-remove" onClick={handleRemoveImage} title="Quitar imagen">
                    ✕
                  </button>
                </div>
              )}
              <div 
                className="search-input-wrapper"
                onClick={(e) => {
                  if (!e.target.closest('button')) {
                    document.getElementById('search-input')?.focus();
                  }
                }}
              >
                <input
                  id="search-input"
                  type="text"
                  className="search-input"
                  placeholder='Ejemplo: "Puente de Ronda"'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
                <div className="camera-wrapper">
                  {query.trim().length > 0 && !referenceImage && (
                    <div className="camera-tooltip">
                      Recomendable añadir<br />foto de referencia
                    </div>
                  )}
                  <input
                    type="file"
                    id="reference-image-input"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    className={`search-camera${referenceImage ? ' search-camera--active' : ''}`}
                    aria-label="Adjuntar imagen de referencia"
                    onClick={() => document.getElementById('reference-image-input').click()}
                    disabled={loading}
                    title="Adjuntar imagen de referencia (opcional)"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
                <button
                  type="submit"
                  className={`search-submit${loading ? ' search-submit--loading' : ''}`}
                  aria-label="Buscar"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {error && !loading && !showModal && (
              <p className="search-error">⚠️ {error}</p>
            )}

            {(result || loading) && !showModal && (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <button
                  type="button"
                  className="btn-reopen-modal"
                  onClick={() => setShowModal(true)}
                  style={{ marginTop: '15px' }}
                >
                  Volver a la generación
                </button>
              </div>
            )}
          </div>
        </div>

        {authView === 'register' && (
          <Register
            onSwitchToLogin={() => setAuthView('login')}
            onSuccess={() => setAuthView('none')}
          />
        )}
        {authView === 'login' && (
          <Login
            onSwitchToRegister={() => setAuthView('register')}
            onSuccess={() => setAuthView('none')}
          />
        )}
      </div>

      <section className="how-section">
        <div className="how-card">
          <h2 className="how-title">Cómo funciona</h2>
          <p className="how-text">
            Cogemos tu idea y la convertimos en una imagen,<br />
            que posteriormente es transformada en un modelo 3D<br />
            gracias a la Inteligencia Artificial.
          </p>
          <p className="how-text how-text--secondary">
            Se genera un archivo en extensión .glb que podrás<br />
            descargar e imprimir.
          </p>
        </div>
      </section>
    </>
  );
}
