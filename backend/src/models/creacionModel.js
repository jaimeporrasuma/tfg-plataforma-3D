//Para Firestore
import { db } from '../config/firebaseAdmin.js';

/* Para Local
import fs from 'fs/promises';
import path from 'path';
*/

//Guarda una creación de modelo 3D en la base de datos.
/*
@param { Object } data - Datos de la creación
@param { string } data.uid - ID del usuario
@param { string } data.prompt - Prompt utilizado para la generación
@param { string } data.modelUrl - URL del archivo GLB 3D generado
@param { string } [data.imageUrl] - URL de la imagen de vista previa
@returns { Promise < string >} - ID del documento guardado
*/

export async function guardarCreacion(data) {
    const creacionData = {
        uid: data.uid,
        prompt: data.prompt.trim(),
        modelUrl: data.modelUrl,
        imageUrl: data.imageUrl || null,
        createdAt: new Date().toISOString(),
        public: true
    };

    //Firestore
    const docRef = await db.collection('creaciones').add(creacionData);
    return docRef.id;

    //Local
    /*
    const localDbPath = path.join(process.cwd(), 'local-database.json');
    
    let dbData = [];
    try {
        const fileContent = await fs.readFile(localDbPath, 'utf-8');
        dbData = JSON.parse(fileContent);
    } catch (err) {
        //El archivo no existe o está vacío, empezamos con array vacío
    }
    
    const newId = Date.now().toString();
    const nuevaCreacion = { id: newId, ...creacionData };
    dbData.push(nuevaCreacion);
    
    await fs.writeFile(localDbPath, JSON.stringify(dbData, null, 2));
    return newId;
    */
}
