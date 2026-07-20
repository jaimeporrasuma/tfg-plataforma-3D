import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

//Truco para usar __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Leemos el archivo de claves maestras (ubicado en la raíz del backend)
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

//Inicializamos la conexión con el proyecto
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'tfgmaquetas.firebasestorage.app'//Bucket de Storage
});

export const bucket = admin.storage().bucket();
export const db = admin.firestore();