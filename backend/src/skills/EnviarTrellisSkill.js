import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const EnviarTrellisSkill = {
    declaration: {
        name: "enviar_a_trellis",
        description: "Envía la imagen validada a la torre GPU con Trellis.2 GGUF para generar el modelo 3D.",
        parameters: {
            type: "OBJECT",
            properties: {
                imagen_base64: {
                    type: "STRING",
                    description: "La imagen en formato base64."
                }
            },
            required: ["imagen_base64"]
        }
    },
    execute: async (args) => {
        console.log(`Enviando imagen a la Trellis.2 GGUF...`);

        try {
            //Eliminar el prefijo data URL si existe
            const base64Puro = args.imagen_base64.replace(/^data:image\/\w+;base64,/, '');

            const bodyStr = JSON.stringify({ imagen_base64: base64Puro });
            console.log(`Tamaño del payload: ${(bodyStr.length / 1024 / 1024).toFixed(2)} MB`);

            //Usamos axios en lugar de fetch nativo: el fetch de Node.js usa undici que tiene
            //un headersTimeout de 30s que no se puede cambiar, y Trellis tarda más en responder.
            const trellisUrl = (process.env.TRELLIS_URL || 'http://localhost:3001').replace(/\/+$/, '');
            const response = await axios.post(
                `${trellisUrl}/api/generar-3d`,
                { imagen_base64: base64Puro },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30 * 60 * 1000 //30 minutos
                }
            );

            console.log(`✅ Respuesta de la torre recibida.`);

            return {
                resultado: response.data.resultado,
                url_modelo: response.data.url_modelo
            };

        } catch (error) {
            console.error(`❌ ERROR al conectar con la torre:`, error.message);
            if (error.cause) {
                console.error(`❌ Causa raíz:`, error.cause);
            }
            return {
                error: "No se pudo contactar con el servidor GPU. Revisar si está encendido o el Firewall."
            };
        }
    }
};

