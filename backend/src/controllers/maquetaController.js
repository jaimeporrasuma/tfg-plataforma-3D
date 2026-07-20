/*
Controlador para gestionar operaciones sobre modelos 3D.
Incluye el proxy para evitar problemas de CORS del navegador al cargar archivos GLB.
*/

export async function getMaquetaProxy(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Falta el parámetro url' });

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Error al descargar el modelo desde el origen remoto' });
        }
        const buffer = await response.arrayBuffer();
        res.set({
            'Content-Type': 'model/gltf-binary',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
        });
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('Error en proxy de modelo:', err);
        res.status(500).json({ error: 'Error interno al proxificar el modelo' });
    }
}
