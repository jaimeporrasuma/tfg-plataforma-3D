import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Elimina un archivo de Firebase Storage a partir de su URL pública.
 * @param {string} fileUrl La URL del archivo.
 */
export const deleteFileFromStorage = async (fileUrl) => {
  if (!fileUrl) return;
  
  // Comprobamos si la URL es de Firebase Storage
  if (fileUrl.includes('firebasestorage.googleapis.com')) {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      console.log(`Archivo eliminado de Storage: ${fileUrl}`);
    } catch (error) {
      console.error(`Error al eliminar archivo de Storage (${fileUrl}):`, error);
    }
  }
};
