import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_VALIDATION_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-3.1-flash-lite'
];

export const ValidarImagenSkill = {
    declaration: {
        name: "validar_imagen",
        description: "Valida si la imagen generada cumple con los requisitos de Trellis (ortográfica, fondo negro, objeto aislado, apto para impresión 3D).",
        parameters: {
            type: "object",
            properties: {
                imagen_base64: {
                    type: "string",
                    description: "La imagen en formato base64 a validar."
                }
            },
            required: ["imagen_base64"]
        }
    },
    execute: async (args) => {
        console.log(`[Skill] Validando calidad de la imagen...`);

        try {
            // Limpiamos el base64 por si viene con el prefijo "data:image/..."
            const base64Data = args.imagen_base64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

            const prompt = `
Eres un experto en modelado 3D y preparación de imágenes para reconstrucción 3D (Photogrammetry/Trellis).
Analiza esta imagen y determina si es VÁLIDA para generar un modelo 3D imprimible.

CRITERIOS ESTRICTOS:
1. Fondo: Debe ser completamente negro sólido (o muy oscuro y liso), sin gradientes ni paisajes.
2. Vista: Debe ser una vista ortográfica o frontal clara del objeto, no cortada.
3. Objeto aislado: Solo debe haber un objeto principal, sin sombras proyectadas en el suelo ni ruido visual.
4. Nivel de detalle: Al ser para impresión 3D, no debe tener detalles excesivamente microscópicos o estructuras imposibles (pelos finos, cables flotantes). Debe tener una base o geometría estable.
5. Ausencia de soportes artificiales o elementos extraños: NO debe contener estructuras de soporte añadidas (andamios, varillas metálicas, marcos triangulares de madera/metal, puntales, tirantes) pegados al cuerpo u objeto. Debe ser el objeto/escultura limpio sobre su base. Si contiene soportes inventados, marcos o varillas, márcala como NO VÁLIDA (es_valida: false) e indica en recomendacion_prompt que se deben eliminar por completo dichos soportes o marcos.

Devuelve tu análisis en formato JSON estricto con esta estructura:
{
  "es_valida": true | false,
  "razon": "Explicación breve de por qué es válida o por qué ha fallado",
  "recomendacion_prompt": "Si falló, sugiere un ajuste para el prompt de la imagen. Si es válida, déjalo vacío."
}
No añadas formato Markdown alrededor del JSON (\`\`\`json), devuelve solo las llaves {}.
`;

            let responseText = null;
            let lastError = null;

            for (const modelName of FALLBACK_VALIDATION_MODELS) {
                try {
                    console.log(`   └─ Intentando validación con ${modelName}...`);
                    const response = await ai.models.generateContent({
                        model: modelName,
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    { text: prompt },
                                    {
                                        inlineData: {
                                            data: base64Data,
                                            mimeType: 'image/png'
                                        }
                                    }
                                ]
                            }
                        ],
                        config: {
                            temperature: 0.2, // Baja temperatura para análisis objetivo
                        }
                    });

                    if (response.text) {
                        responseText = response.text.trim();
                        break;
                    }
                } catch (modelError) {
                    console.warn(`   ⚠️ Falló validación con ${modelName}:`, modelError.message);
                    lastError = modelError;
                }
            }

            if (!responseText) {
                throw lastError || new Error("Ningún modelo de validación pudo responder.");
            }

            // Extraer JSON limpiando posibles etiquetas markdown o texto alrededor
            const firstBrace = responseText.indexOf('{');
            const lastBrace = responseText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                responseText = responseText.substring(firstBrace, lastBrace + 1);
            }

            const analisis = JSON.parse(responseText.trim());
            console.log(`   └─ Resultado: ${analisis.es_valida ? '✅ VÁLIDA' : '❌ RECHAZADA'} - ${analisis.razon}`);

            return {
                resultado: analisis.razon,
                es_valida: analisis.es_valida,
                sugerencia: analisis.recomendacion_prompt || null
            };

        } catch (error) {
            console.error(`❌ [Skill] Error al validar la imagen con Gemini:`, error.message);
            // En caso de fallo de la API de validación, asumimos true para no bloquear el flujo
            return {
                resultado: "Fallo en el servicio de validación. Asumiendo imagen válida por defecto.",
                es_valida: true
            };
        }
    }
};
