import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GenerarImagenSkill } from '../skills/GenerarImagenSkill.js';
import { EnviarTrellisSkill } from '../skills/EnviarTrellisSkill.js';
import { ValidarImagenSkill } from '../skills/ValidarImagenSkill.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//Modelos Gemini
const FALLBACK_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-3.5-flash',
    'gemini-2.5-pro',
    'gemini-3.1-pro-preview',
];

//Indica si un error es de saturación/sobrecarga (vale la pena reintentar con otro modelo)
const isOverloadedError = (err) => {
    const msg = (err?.message || '').toLowerCase();
    const status = err?.status ?? err?.httpStatus ?? err?.code;
    return (
        status === 429 ||
        status === 503 ||
        msg.includes('overloaded') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('resource_exhausted') ||
        msg.includes('service unavailable')
    );
};

//Crea una sesión de chat probando los modelos de FALLBACK_MODELS en orden.
//Devuelve { chatSession, modelUsed }.
const createChatWithFallback = (config) => {
    //La sesión se crea de forma síncrona; el error de saturación llega al primer sendMessage.
    //Devolvemos una función que crea la sesión para el modelo indicado, manteniendo el historial.
    const createForModel = (model, history = []) =>
        ai.chats.create({ model, config, history: [...history] });

    return { createForModel, models: FALLBACK_MODELS };
};

const availableSkills = {
    [GenerarImagenSkill.declaration.name]: GenerarImagenSkill,
    [EnviarTrellisSkill.declaration.name]: EnviarTrellisSkill,
    [ValidarImagenSkill.declaration.name]: ValidarImagenSkill
};

const agentTools = [{
    functionDeclarations: Object.values(availableSkills).map(skill => skill.declaration)
}];

export const iniciarAgente = async (userIdea, referenceImage = null) => {
    console.log(`\nIniciando Agente IA para: "${userIdea}"`);
    if (referenceImage) console.log(`Imagen de referencia proporcionada.`);

    const promptPath = path.join(__dirname, '../prompts/agents.md');
    const systemInstructionMD = fs.readFileSync(promptPath, 'utf8');

    const chatConfig = {
        tools: agentTools,
        systemInstruction: systemInstructionMD,
        temperature: 0.2
    };

    const { createForModel, models } = createChatWithFallback(chatConfig);

    //Índice del modelo actualmente en uso
    let modelIndex = 0;
    let chatSession = createForModel(models[modelIndex]);
    console.log(`Modelo seleccionado: ${models[modelIndex]}`);

    let isTaskComplete = false;
    let finalResultMessage = "";
    let currentInput = referenceImage
        ? `El usuario quiere: ${userIdea}. El usuario ha proporcionado una imagen de referencia. Reproduce con la máxima fidelidad la escultura/objeto de la foto SIN añadir soportes, andamios, marcos triangulares, varillas ni elementos extraños. Comienza tu flujo.`
        : `El usuario quiere: ${userIdea}. Comienza tu flujo.`;

    let capturedImage = null;
    let captured3DUrl = null;
    let hasAttemptedImage = false;
    let hasAttemptedTrellis = false;

    while (!isTaskComplete) {
        console.log("Agente pensando su siguiente movimiento...");

        //Lanzamos la petición con manejo de fallback por saturación
        let response;
        try {
            response = await chatSession.sendMessage({ message: currentInput });
        } catch (sendError) {
            if (isOverloadedError(sendError)) {
                modelIndex++;
                if (modelIndex >= models.length) {
                    console.error('ERROR: Todos los modelos de Gemini están saturados.');
                    throw sendError;
                }
                console.warn(
                    `ATENCIÓN:Modelo ${models[modelIndex - 1]} saturado. ` +
                    `Cambiando a ${models[modelIndex]}...`
                );
                //Nueva sesión con el modelo alternativo y conservando el historial
                chatSession = createForModel(models[modelIndex], chatSession.history);
                continue; //reintentar el mismo currentInput con el nuevo modelo
            }
            throw sendError;
        }

        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            const skillToRun = availableSkills[call.name];

            if (skillToRun) {
                try {
                    let argsCloned = { ...call.args };

                    if (call.name === "generar_imagen_ortografica") hasAttemptedImage = true;
                    if (call.name === "enviar_a_trellis") hasAttemptedTrellis = true;

                    //El agente no tiene el base64 real (lo sustituimos por un token simbólico).
                    //Inyectamos la imagen capturada en las skills que la necesitan.
                    if ((call.name === "enviar_a_trellis" || call.name === "validar_imagen") && capturedImage) {
                        argsCloned.imagen_base64 = capturedImage;
                        console.log(`AGENTE Inyectando imagen en ${call.name}`);
                    }

                    //Si hay imagen de referencia del usuario, inyectarla en la skill de imagen
                    if (call.name === "generar_imagen_ortografica" && referenceImage) {
                        argsCloned.imagen_referencia_base64 = referenceImage;
                        console.log("AGENTE Inyectando imagen de referencia opcional en generar_imagen_ortografica");
                    }

                    const result = await skillToRun.execute(argsCloned);

                    //Guardamos los datos pesados localmente sin mandarlos al modelo
                    let modelResult = { ...result };

                    if (call.name === "generar_imagen_ortografica") {
                        if (result.imagen_base64) {
                            capturedImage = result.imagen_base64;
                            //El base64 puede pesar varios MB: lo sustituimos por un token simbólico
                            modelResult = {
                                resultado: result.resultado,
                                imagen_base64: "[IMAGEN_GENERADA_Y_ALMACENADA_LOCALMENTE]"
                            };
                        }
                    }
                    if (call.name === "enviar_a_trellis") {
                        if (result.url_modelo) {
                            captured3DUrl = result.url_modelo;
                        }
                    }

                    currentInput = [{
                        functionResponse: { id: call.id, name: call.name, response: modelResult }
                    }];

                } catch (error) {
                    console.error(`❌ Falló la skill ${call.name}:`, error);
                    currentInput = [{
                        functionResponse: { id: call.id, name: call.name, response: { error: "Fallo en la herramienta." } }
                    }];
                }
            } else {
                currentInput = [{
                    functionResponse: { id: call.id, name: call.name, response: { error: "Herramienta no encontrada." } }
                }];
            }
        } else {
            if (!capturedImage && !hasAttemptedImage) {
                console.warn("ATENCIÓN: El modelo intentó terminar sin llamar a generar_imagen_ortografica. Forzando rectificación...");
                currentInput = "ERROR CRÍTICO: Has intentado terminar tu turno sin llamar a la herramienta 'generar_imagen_ortografica'. Es OBLIGATORIO que diseñes el prompt técnico y llames a la herramienta ahora mismo.";
                continue;
            }
            if (capturedImage && !captured3DUrl && !hasAttemptedTrellis) {
                console.warn("ATENCIÓN: El modelo intentó terminar sin llamar a enviar_a_trellis. Forzando rectificación...");
                currentInput = "ERROR CRÍTICO: Has intentado terminar tu turno sin llamar a la herramienta 'enviar_a_trellis'. Es OBLIGATORIO que llames a 'enviar_a_trellis' ahora mismo pasándole el token simbólico de la imagen generada. No respondas nada más, solo usa la herramienta.";
                continue;
            }

            console.log("✅ El Agente ha completado su misión.");
            finalResultMessage = response.text;
            isTaskComplete = true;
        }
    }

    return {
        message: finalResultMessage,
        imageUrl: capturedImage,
        modelUrl: captured3DUrl
    };
};