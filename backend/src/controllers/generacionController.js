import { iniciarAgente } from '../services/AgenteService.js';
import { almacenarMaqueta3D, almacenarImagen } from '../services/StorageService.js';
import { guardarCreacion } from '../models/creacionModel.js';

/*
Controlador para gestionar la generación de maquetas 3D.
Maneja la entrada HTTP, coordina el Agente IA, las subidas de archivos
y la persistencia en el modelo (Base de Datos).
*/

export async function generarMaqueta3D(req, res) {
    try {
        const userText = req.body.prompt;
        const referenceImage = req.body.referenceImage || null; //base64 puro (opcional)
        const uid = req.body.uid; //ID usuario

        if (!userText) {
            return res.status(400).json({ error: 'Debes proporcionar un prompt.' });
        }

        console.log(`\n--- Nueva petición recibida ---`);
        if (uid) console.log(`Usuario: ${uid}`);
        if (referenceImage) console.log(`Imagen de referencia incluida`);

        //El Agente genera el modelo en la torre
        const agentResult = await iniciarAgente(userText, referenceImage);
        let finalModelUrl = agentResult.modelUrl;
        let finalImageUrl = agentResult.imageUrl;

        //Si todo ha ido bien, almacenamos el modelo y la imagen
        if (finalModelUrl) {
            console.log(`\n--- Guardando archivos en el almacenamiento configurado ---`);
            finalModelUrl = await almacenarMaqueta3D(finalModelUrl);

            //Almacenamos la foto generada por Gemini
            if (finalImageUrl) {
                finalImageUrl = await almacenarImagen(finalImageUrl);
            }

            //Guardar creación en la Base de Datos
            if (uid) {
                try {
                    const savedId = await guardarCreacion({
                        uid,
                        prompt: userText,
                        modelUrl: finalModelUrl,
                        imageUrl: finalImageUrl
                    });
                    console.log(`✅ Creación guardada con ID: ${savedId} en el modelo.`);
                } catch (saveErr) {
                    console.error('❌ Error al guardar en el modelo de base de datos:', saveErr);
                }
            }
        }

        //Mandamos el resultado al frontend
        res.json({
            success: true,
            agentMessage: agentResult.message,
            imageUrl: finalImageUrl,
            model3DUrl: finalModelUrl
        });

    } catch (error) {
        console.error('ERROR en el controlador de generación:', error.message);
        console.error('Stack trace completo:\n', error.stack);
        res.status(500).json({ success: false, error: 'FALLO en el orquestador.' });
    }
}
