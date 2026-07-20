import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUsername, setDbUsername] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', u.uid));
          if (userDoc.exists()) {
            setDbUsername(userDoc.data().username);
          }
        } catch (err) {
          console.error("Error al obtener username:", err);
        }
      } else {
        setDbUsername(null);
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setDbUsername(null);
  };

  const value = {
    user,
    dbUsername,
    setDbUsername,
    logout,
    loadingAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
}
