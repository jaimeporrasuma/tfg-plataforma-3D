import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_IMAGE_MODELS = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview'
];

export const generarImagenOrtografica = async (prompt, referenceImageBase64 = null) => {
    let lastError = null;

    for (const modelName of FALLBACK_IMAGE_MODELS) {
        try {
            console.log(`Intentando generar imagen con ${modelName}...`);

            //Construimos el contenido de la petición
            let contents;

            if (referenceImageBase64) {
                //Imagen de referencia + prompt de texto
                console.log(`Incluyendo imagen de referencia en la petición a Gemini.`);
                contents = [
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: referenceImageBase64
                        }
                    },
                    {
                        text: `Using this image as a visual reference, generate a new orthographic 3D render of the subject. ${prompt}. IMPORTANT: The output must be a clean orthographic render suitable for 3D printing - use the reference image only as inspiration for shape and structure, but render it as a simplified low-polygon 3D model on a solid black background.`
                    }
                ];
            } else {
                //Modo solo texto
                contents = prompt;
            }

            const response = await ai.models.generateContent({
                model: modelName,
                contents: contents
            });

            let base64Image = null;

            //Iteramos sobre los campos de la respuesta buscando los datos de la imagen
            if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        //Aquí está nuestra imagen en base64 crudo
                        base64Image = part.inlineData.data;
                        break; //Ya la tenemos, salimos del bucle
                    }
                }
            }

            if (!base64Image) {
                throw new Error("La IA no incluyó datos de imagen en su respuesta.");
            }

            console.log(`✅ ¡Imagen generada con éxito usando ${modelName}!`);

            // Convertimos a URL de datos para el navegador
            const imageUrl = `data:image/png;base64,${base64Image}`;

            return imageUrl;

        } catch (error) {
            console.warn(`ATENCIÓN: Fallo con ${modelName}:`, error.message);
            lastError = error;
            //El bucle continuará e intentará con el siguiente modelo de la lista
        }
    }

    console.error('❌ Error fatal, ningún modelo de imagen funcionó:', lastError?.message || lastError);
    throw new Error('Fallo al generar la imagen ortográfica tras intentar todos los modelos de fallback.');
};