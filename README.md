# TuMaqueta - Plataforma Web de Generación 3D

Este es el repositorio oficial para el Trabajo de Fin de Grado (TFG) **TuMaqueta**, una plataforma web que permite generar modelos 3D listos para impresión a partir de texto e imágenes, haciendo uso de Inteligencia Artificial.

## Arquitectura del Proyecto

El proyecto sigue una arquitectura desacoplada basada en microservicios y contenedores:

1. **Frontend (Cliente):** Desarrollado con **React 19** y **Vite**. Gestiona la interfaz de usuario, la autenticación (con Firebase) y el visor 3D interactivo con **Three.js** (@react-three/fiber).
2. **Backend (Servidor):** Desarrollado con **Node.js** y **Express 5**. Actúa como API Gateway y orquestador mediante un **Agente IA (Gemini)** para coordinar la generación conceptual, el almacenamiento (Firebase o local) y la inferencia 3D.
3. **Servidor 3D (GPU Bridge):** Microservicio Node.js en `server-3D` que actúa como puente API/WebSocket hacia el motor de inferencia de **ComfyUI** y **Trellis.2 (GGUF)**.

## Tecnologías Utilizadas

* **Frontend:** React 19, Vite, Three.js, @react-three/fiber, React Router DOM v7, Nginx.
* **Backend:** Node.js, Express 5, Firebase Admin SDK, SDK de Gemini (@google/genai).
* **Base de Datos y Almacenamiento:** Cloud Firestore, Firebase Storage (o almacenamiento local en `./uploads/`).
* **Infraestructura y Despliegue:** Docker, Docker Compose, Tailscale.
* **IA Generativa:** Servidor GPU (Trellis.2 GGUF con ComfyUI) y Google Gemini (Gemini 2.5 Flash e Imagen 3).

## Instalación y Ejecución

### Requisitos Previos de Configuración
1. Configura las variables de entorno copiando `backend/.env.example` a `backend/.env` (añadiendo tu `GEMINI_API_KEY`).
2. Coloca tu clave privada de Firebase en `backend/firebase-service-account.json`.
3. *(Opcional)* Si vas a usar generación 3D con GPU local, copia `server-3D/.env.example` a `server-3D/.env` con la ruta de tu ComfyUI.
4. *(Nota sobre CORS)* En la raíz se incluye `cors.json` por si necesitas habilitar reglas CORS en tu bucket de Firebase Storage (`gsutil cors set cors.json gs://<tu-bucket>`).

### Opción A: Ejecución Rápida con Docker (Recomendada)
Para simplificar el despliegue del proyecto, se ha contenerizado la plataforma:
1. Asegúrate de tener **Docker Desktop** instalado y ejecutándose.
2. Haz doble clic en el archivo `iniciar-docker.bat` en la raíz del proyecto.
   * *Este script validará la configuración, construirá las imágenes, levantará los contenedores en segundo plano y abrirá tu navegador automáticamente en `http://localhost:5173`.*
3. Si vas a generar modelos con tu GPU local, arranca ComfyUI y haz doble clic en `server-3D/iniciar-server-3d.bat`.

### Opción B: Ejecución Manual (Desarrollo)
1. Backend: `cd backend` -> `npm install` -> `npm run dev` (puerto 8080)
2. Frontend: `cd frontend` -> `npm install` -> `npm run dev` (puerto 5173)
3. Servidor 3D (opcional): `cd server-3D` -> `npm install` -> `node server.js` (puerto 3001)

## Decisiones de Diseño
* **Arquitectura Basada en Contenedores (Docker):** El uso de Docker Compose garantiza que el frontend (servido estáticamente por Nginx) y el backend se ejecuten en entornos idénticos aislados.
* **Agente IA Autónomo:** La lógica de generación está dirigida por un Agente IA (Gemini con Function Calling) que decide dinámicamente qué herramientas ejecutar (generar imagen 2D de referencia, llamar a la GPU, validar errores), dotando al backend de comportamiento autónomo.
* **Visor 3D Interactivo:** Integración de Three.js para renderizado en tiempo real, modo Wireframe, cambio de color y descarga del modelo en formato universal `.glb`.
* **Patrón MVC y Servicios:** La lógica de negocio del servidor se encuentra separada en la capa `services/` (`AgenteService`, `StorageService`, etc.) para mantener los controladores limpios y facilitar la mantenibilidad.
* **Estado Global con Context API:** El estado de sesión del usuario se maneja de manera global en el frontend mediante `AuthContext`, eliminando la necesidad de pasar propiedades (Prop Drilling).
