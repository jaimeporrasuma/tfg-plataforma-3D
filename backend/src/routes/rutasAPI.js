import { Router } from 'express';
import { getMaquetaProxy } from '../controllers/maquetaController.js';
import { generarMaqueta3D } from '../controllers/generacionController.js';

const router = Router();

//Endpoint Proxy para modelos GLB (CORS bypass)
router.get('/proxy-maqueta-3d', getMaquetaProxy);

//Endpoint principal para la generación de la maqueta 3D
router.post('/generar-maqueta-3d', generarMaqueta3D);

export default router;
