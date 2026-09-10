import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import accountIcon from '../assets/account_circle.svg';
import styles from './Navbar.module.css';

export default function Navbar({ authView, setAuthView }) {
  const { user, dbUsername, isAdmin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close auth modal if user logs in
  useEffect(() => {
    if (user) setAuthView('none');
  }, [user, setAuthView]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    logout();
    navigate('/');
  };

  const handleOpenAuth = (view) => {
    setAuthView(view);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <div className={user ? styles.topBarLoggedIn : styles.topBar}>
      <div className={styles.topBarLeft}>
        <h1 className={`${styles.logo} ${styles.logoLeft}`} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>TuMaqueta</h1>
      </div>

      <div className={styles.topBarCenter}>
        <nav className={styles.navPill}>
          <NavLink to="/galeria" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            Galería
          </NavLink>
          <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            Crea TuMaqueta
          </NavLink>
          {user && (
            <NavLink to="/creaciones" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
              Tus Creaciones
            </NavLink>
          )}
          {user && isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
              Administración
            </NavLink>
          )}
        </nav>
      </div>

      <div className={styles.topBarRight}>
        {user ? (
          <div className={styles.userDropdownContainer} ref={userMenuRef}>
            <div className={styles.userPill} onClick={() => setShowUserMenu(!showUserMenu)}>
              <img src={accountIcon} alt="User" className={styles.userIcon} />
              <span className={styles.userName}>{dbUsername || user?.displayName || user?.email?.split('@')[0]}</span>
            </div>

            {showUserMenu && (
              <div className={styles.userMenu}>
                <button className={styles.userMenuItem} onClick={() => { setShowUserMenu(false); navigate('/perfil'); }}>
                  Configurar perfil
                </button>
                <button className={`${styles.userMenuItem} ${styles.userMenuItemLogout}`} onClick={handleLogoutClick}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.topBarAuthButtons}>
            {authView !== 'login' && (
              <button className={styles.btnLoginTop} onClick={() => handleOpenAuth('login')}>
                Iniciar sesión
              </button>
            )}
            {authView !== 'register' && (
              <button className={styles.btnRegisterTop} onClick={() => handleOpenAuth('register')}>
                Registrarse
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
