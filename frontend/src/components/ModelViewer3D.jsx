/**
 * ModelViewer3D.jsx
 * Visor 3D reutilizable usando React Three Fiber (R3F) + @react-three/drei.
 * Renderiza sobre WebGL 2.0 (el renderizador estable de Three.js),
 * con la escena definida de forma declarativa en JSX según el paradigma React.
 *
 * Características:
 *  - ErrorBoundary: atrapa cualquier crash de Three.js sin romper la app
 *  - OrbitControls: rotación libre, zoom con rueda, paneo con clic derecho
 *  - Suspense con fallback de spinner mientras se descarga/decodifica el GLB
 *  - Centro automático del modelo (Center + useGLTF)
 *  - Iluminación PBR: ambient + directional + environment preset
 *  - Responsive: ocupa el 100% del contenedor padre
 */

import { Suspense, useRef, Component } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center, Environment } from '@react-three/drei'

// ── ErrorBoundary: captura errores de Three.js / carga GLB ────────────────
class ThreeErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'Error desconocido' }
  }

  componentDidCatch(error, info) {
    console.error('[ModelViewer3D] Error capturado:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%', height: '100%', minHeight: '320px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: '16px', gap: '12px', padding: '24px',
        }}>
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', textAlign: 'center', margin: 0 }}>
            No se pudo cargar el modelo 3D
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
            {this.state.errorMsg}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Sub-componente: carga y sitúa el modelo GLB en escena ──────────────────
function GLBModel({ url }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

// ── Fallback 3D visible mientras <Suspense> descarga y decodifica el GLB ───
function LoadingMesh() {
  const ref = useRef()
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.35, 24, 24]} />
      <meshStandardMaterial color="#FF8D28" wireframe />
    </mesh>
  )
}

// ── La escena Three.js (aislada en su propio componente por el ErrorBoundary)
function ThreeScene({ modelUrl }) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 4], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      dpr={Math.min(window.devicePixelRatio, 2)}
      onCreated={({ gl }) => {
        gl.setClearColor('#111827')
      }}
    >
      {/* ── Iluminación PBR ── */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} />
      <directionalLight position={[-5, 2, -5]} intensity={0.4} color="#a0c4ff" />
      <Environment preset="city" />

      {/* ── Modelo GLB con Suspense para carga asíncrona ── */}
      <Suspense fallback={<LoadingMesh />}>
        <GLBModel url={modelUrl} />
      </Suspense>

      {/* ── Controles de órbita: girar, zoom, paneo ── */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={1.5}
        minDistance={0.5}
        maxDistance={15}
      />
    </Canvas>
  )
}

// ── Componente principal exportado ─────────────────────────────────────────
export default function ModelViewer3D({ modelUrl, style = {} }) {
  if (!modelUrl) return null

  //Pasamos la URL del Storage por el proxy del backend
  //para evitar el bloqueo CORS del navegador.
  const proxiedUrl = `/api/proxy-maqueta-3d?url=${encodeURIComponent(modelUrl)}`

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '320px',
        position: 'relative',
        ...style,
      }}
    >
      <ThreeErrorBoundary>
        <ThreeScene modelUrl={proxiedUrl} />
      </ThreeErrorBoundary>

      {/* ── Hint de controles (solo si hay canvas activo) ── */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.45)',
        fontSize: '0.7rem',
        fontFamily: 'var(--font-heading)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 2,
      }}>
        🖱️ Arrastrar para rotar · Rueda para zoom
      </div>
    </div>
  )
}
