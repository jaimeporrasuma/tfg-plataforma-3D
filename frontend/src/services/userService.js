import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Comprueba si un nombre de usuario ya está registrado en la base de datos.
 * @param {string} username El nombre de usuario a comprobar
 * @returns {Promise<boolean>} true si existe, false si está libre
 */
export const checkUsernameExists = async (username) => {
  if (!username) return false;
  
  const usernameLowerToSearch = username.trim().toLowerCase();
  const usersQuery = query(
    collection(db, 'usuarios'), 
    where('usernameLower', '==', usernameLowerToSearch)
  );
  
  const querySnapshot = await getDocs(usersQuery);
  
  return !querySnapshot.empty;
}
