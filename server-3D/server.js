import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.set('trust proxy', true);
const PORT = 3001; 

// --- CONFIGURACIÓN VITAL ---
// Si estamos en Docker usamos las variables de entorno, si no, las locales de Windows
const COMFYUI_DIR = process.env.COMFYUI_DIR || process.env.COMFYUI_WINDOWS_DIR;
const COMFY_API_URL = process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188';

const COMFY_INPUT = path.join(COMFYUI_DIR, 'input');
const COMFY_OUTPUT = path.join(COMFYUI_DIR, 'output');

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// Exponemos la carpeta de salida para que el portátil pueda descargar el .glb final
app.use('/modelos', express.static(COMFY_OUTPUT));

app.post('/api/generar-3d', async (req, res) => {
    console.log("\n--- 🚀 NUEVA PETICIÓN 3D DESDE EL PORTÁTIL ---");
    
    const { imagen_base64 } = req.body;
    if (!imagen_base64) return res.status(400).json({ error: "Falta la imagen." });

    try {
        //Limpiar el Base64 por si no se ha quitado antes y guardar la imagen de forma SEGURA (Buffer)
        const base64Puro = imagen_base64.replace(/^data:image\/\w+;base64,/, '');
        
        //Convertimos el texto a archivo binario puro
        const imageBuffer = Buffer.from(base64Puro, 'base64'); 
        
        const nombreImagen = `tfg_input_${Date.now()}.png`;
        const rutaImagen = path.join(COMFY_INPUT, nombreImagen);
        
        //Guardamos el binario real
        fs.writeFileSync(rutaImagen, imageBuffer);
        console.log(`[1/4] 📸 Imagen binaria guardada como: ${nombreImagen}`);

        //Cargar el mapa (JSON) y modificarlo con nuestros datos
        const workflowRaw = fs.readFileSync('./workflow.json', 'utf8');
        const workflow = JSON.parse(workflowRaw);
        
        const nombreSalida = `tfg_modelo_${Date.now()}`;
        
        workflow["13"].inputs.image = nombreImagen; // Nodo 13: La foto nueva
        workflow["35"].inputs.value = nombreSalida; // Nodo 35: El nombre del modelo 3D

        console.log(`[2/4] Mapa inyectado. Archivo destino será: ${nombreSalida}.glb`);

        //Disparar a ComfyUI (Pulsar el botón 'Ejecutar' por API)
        const comfyRes = await fetch(COMFY_API_URL+'/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });
        
        const comfyData = await comfyRes.json();
        const promptId = comfyData.prompt_id;
        console.log(`[3/4] ComfyUI trabajando... (ID Tarea: ${promptId})`);

        //Preguntar a ComfyUI cada 5 segundos si ha terminado (Polling)
        let terminado = false;
        while (!terminado) {
            await new Promise(r => setTimeout(r, 5000)); // Espera 5s
            
            const historialRes = await fetch(`${COMFY_API_URL}/history/${promptId}`);
            const historialData = await historialRes.json();
            
            //Si la tarea aparece en el historial, es que ha terminado
            if (historialData[promptId]) {
                terminado = true;
            } else {
                process.stdout.write("."); //Pone puntitos en la consola mientras espera
            }
        }

        console.log(`\n[4/4] ✅ ¡Modelo 3D Generado con éxito en la GPU!`);
        
        //Buscar el nombre EXACTO del archivo generado
        const archivosEnOutput = fs.readdirSync(COMFY_OUTPUT);

        //Búsqueda del activo 3D final en el directorio de salida
        const nombreFinal = archivosEnOutput.find(archivo => 
            archivo.startsWith(nombreSalida) && archivo.endsWith('.glb')
        );

        if (!nombreFinal) {
            console.error("ERROR: ComfyUI terminó pero no encuentro el archivo .glb");
            return res.status(500).json({ error: "El modelo se generó pero no se pudo localizar en output." });
        }

        console.log(`Archivo final localizado: ${nombreFinal}`);

        //Forzar a ComfyUI a vaciar la RAM y VRAM
        try {
            console.log(`[5/5]Ordenando a ComfyUI que libere la memoria...`);
            await fetch(`${COMFY_API_URL}/free`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    unload_models: true, 
                    free_memory: true 
                })
            });
            console.log(`Memoria liberada con éxito. Lista para la siguiente petición.`);
        } catch (err) {
            console.warn(`AVISO: Falló la petición de limpieza de memoria.`, err.message);
        }

        //Devolverle la URL final REAL al cliente (Dinámica)
        const hostHeader = req.get('host'); // Detecta si es 192..., 100... o localhost
        const protocolo = req.protocol; // Detecta si es http o https

        res.json({
            resultado: "Modelo 3D generado correctamente por la GPU Worker.",
            url_modelo: `${protocolo}://${hostHeader}/modelos/${nombreFinal}`
        });

    } catch (error) {
        console.error("\n❌ Error en el servidor GPU:", error);
        res.status(500).json({ error: "Fallo al procesar con ComfyUI." });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ===================================================
    🖥️  GPU WORKER + COMFYUI PUENTE INICIADO
    📡 Escuchando en: http://0.0.0.0:${PORT}
    ===================================================
    `);
});