import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Comprueba si un nombre de usuario ya está registrado en la base de datos.
 * @param {string} username El nombre de usuario a comprobar
 * @param {string} [excludeUid] UID del usuario actual para excluirlo de la comprobación
 * @returns {Promise<boolean>} true si existe en otro usuario, false si está libre
 */
export const checkUsernameExists = async (username, excludeUid = null) => {
  if (!username) return false;

  const usernameLowerToSearch = username.trim().toLowerCase();
  const usersQuery = query(
    collection(db, 'usuarios'),
    where('usernameLower', '==', usernameLowerToSearch)
  );

  const querySnapshot = await getDocs(usersQuery);
  if (querySnapshot.empty) return false;

  if (excludeUid) {
    return querySnapshot.docs.some((d) => d.id !== excludeUid);
  }

  return true;
}
