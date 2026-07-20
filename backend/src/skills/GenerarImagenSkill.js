import { generarImagenOrtografica } from '../services/GeneracionImagenService.js';

export const GenerarImagenSkill = {
    //Manual que lee la IA
    declaration: {
        name: "generar_imagen_ortografica",
        description: "Genera una imagen 2D basada en un prompt técnico. Úsala SIEMPRE como primer paso para crear el asset visual.",
        parameters: {
            type: "object",
            properties: {
                prompt_tecnico: {
                    type: "string",
                    description: "El prompt técnico en inglés optimizado para 3D."
                }
            },
            required: ["prompt_tecnico"]
        }
    },

    //Acción que ejecuta el servidor
    execute: async (args) => {
        console.log(`Ejecutando Skill de Imagen con prompt: ${args.prompt_tecnico}`);
        if (args.imagen_referencia_base64) {
            console.log(`-- Usando imagen de referencia del usuario como base visual.`);
        }

        //Llamamos al servicio real (con imagen de referencia opcional)
        const imageUrl = await generarImagenOrtografica(args.prompt_tecnico, args.imagen_referencia_base64 || null);

        //Devolvemos el resultado formateado para que el Agente lo entienda
        return {
            resultado: "Imagen generada con éxito",
            imagen_base64: imageUrl
        };
    }
};