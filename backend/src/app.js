import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rutasAPI from './routes/rutasAPI.js';

dotenv.config();

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT ?? 8080;

//Middlewares globales
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

//Rutas modulares
app.use('/api', rutasAPI);

//Servidor
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
        console.error(`\nERROR: El puerto ${PORT} está bloqueado por Windows o en uso.`);
        process.exit(1);
    } else {
        console.error('Error iniciando el servidor:', err);
    }
});

//Ejecuto función vacía cada hora para que no se cierre el servidor
setInterval(() => { }, 1000 * 60 * 60);