import { bucket } from '../config/firebaseAdmin.js';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

dotenv.config();

//Proveedor de almacenamiento: 'firebase' o 'local'
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'firebase';
const BACKEND_URL = `http://localhost:${process.env.PORT || 8080}`;

//Asegurar que las carpetas locales de uploads existan si se usa el modo local
const localUploadsDir = path.join(process.cwd(), 'uploads');
if (STORAGE_PROVIDER === 'local') {
    if (!fs.existsSync(path.join(localUploadsDir, 'modelos'))) {
        fs.mkdirSync(path.join(localUploadsDir, 'modelos'), { recursive: true });
    }
    if (!fs.existsSync(path.join(localUploadsDir, 'imagenes'))) {
        fs.mkdirSync(path.join(localUploadsDir, 'imagenes'), { recursive: true });
    }
}

//Descarga y guarda el modelo 3D GLB desde el server GPU.
//Soporta almacenamiento en Firebase Storage o almacenamiento local.
export const almacenarMaqueta3D = async (modelUrl) => {
    try {
        console.log(`Descargando modelo desde el server GPU... URL: ${modelUrl}`);
        const response = await axios.get(modelUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }).catch(err => {
            if (err.response) {
                console.error(`❌ HTTP 403 Detalle:`, err.response.data.toString());
            }
            throw err;
        });
        const buffer = response.data;
        const filename = `maqueta_${Date.now()}.glb`;

        if (STORAGE_PROVIDER === 'local') {
            console.log(`Guardando modelo en almacenamiento LOCAL...`);
            const filePath = path.join(localUploadsDir, 'modelos', filename);
            await fs.promises.writeFile(filePath, buffer);

            const publicUrl = `${BACKEND_URL}/uploads/modelos/${filename}`;
            console.log(`✅ Guardado local exitoso. URL: ${publicUrl}`);
            return publicUrl;
        } else {
            console.log(`Subiendo modelo a Firebase Storage...`);
            const storageFilename = `modelos/${filename}`;
            const file = bucket.file(storageFilename);
            const downloadToken = crypto.randomUUID();

            await file.save(buffer, {
                metadata: {
                    contentType: 'model/gltf-binary',
                    metadata: {
                        firebaseStorageDownloadTokens: downloadToken
                    }
                }
            });

            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storageFilename)}?alt=media&token=${downloadToken}`;
            console.log(`✅ Subida a Firebase Storage exitosa URL pública: ${publicUrl}`);
            return publicUrl;
        }
    } catch (error) {
        console.error('❌ Error en StorageService (Maqueta):', error.message);
        throw new Error(`Fallo al almacenar el modelo en modo [${STORAGE_PROVIDER}].`);
    }
};

//Procesa y guarda la imagen base64 de vista previa.
//Soporta almacenamiento en Firebase Storage o almacenamiento local.
export const almacenarImagen = async (base64String) => {
    try {
        if (!base64String) return null;

        //Extraer la data pura (por si viene con "data:image/png;base64,")
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `concepto_${Date.now()}.png`;

        if (STORAGE_PROVIDER === 'local') {
            console.log(`Guardando imagen en almacenamiento LOCAL...`);
            const filePath = path.join(localUploadsDir, 'imagenes', filename);
            await fs.promises.writeFile(filePath, buffer);

            const publicUrl = `${BACKEND_URL}/uploads/imagenes/${filename}`;
            console.log(`✅ Imagen guardada en local URL: ${publicUrl}`);
            return publicUrl;
        } else {
            console.log(`Subiendo imagen a Firebase Storage...`);
            const storageFilename = `imagenes/${filename}`;
            const file = bucket.file(storageFilename);
            const downloadToken = crypto.randomUUID();

            await file.save(buffer, {
                metadata: {
                    contentType: 'image/png',
                    metadata: {
                        firebaseStorageDownloadTokens: downloadToken
                    }
                }
            });

            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storageFilename)}?alt=media&token=${downloadToken}`;
            console.log(`✅ Subida de imagen exitosa URL pública: ${publicUrl}`);
            return publicUrl;
        }
    } catch (error) {
        console.error('❌ Error en StorageService (Imagen):', error.message);
        return null;
    }
};