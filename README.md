# TuMaqueta - Plataforma Web de Generación 3D

Este es el repositorio oficial para el Trabajo de Fin de Grado (TFG) **TuMaqueta**, una plataforma web que permite generar modelos 3D listos para impresión a partir de texto e imágenes, haciendo uso de Inteligencia Artificial.

## Arquitectura del Proyecto

El proyecto está dividido en dos partes principales, siguiendo una arquitectura Cliente-Servidor:

1. **Frontend (Cliente):** Desarrollado con **React** y **Vite**. Gestiona la interfaz de usuario, la autenticación (con Firebase) y el visor 3D interactivo. Utiliza React Router para la navegación y Context API para la gestión del estado global.
2. **Backend (Servidor):** Desarrollado con **Node.js** y **Express**. Actúa como API Gateway para orquestar la comunicación entre el frontend, Firebase Firestore/Storage o BBDD propia, y el servidor de inferencia de IA.

## Tecnologías Utilizadas

* **Frontend:** React 18, Vite, React Router DOM, Nginx.
* **Backend:** Node.js, Express, Firebase Admin SDK, SDK de Gemini.
* **Base de Datos y Almacenamiento:** Cloud Firestore, Firebase Storage (es posible cambiar a BBDD propia).
* **Infraestructura y Despliegue:** Docker, Docker Compose, Tailscale.
* **IA Generativa:** Servidor GPU externo (Trellis.2 GGUF) y Gemini.

## Instalación y Ejecución

### Opción A: Ejecución Rápida con Docker (Recomendada)
Para simplificar el despliegue del proyecto, se ha contenerizado toda la plataforma.
1. Asegúrate de tener **Docker Desktop** instalado y ejecutándose.
2. Configura las variables de entorno copiando `backend/.env.example` a `backend/.env`.
3. Haz doble clic en el archivo `iniciar-docker.bat` en la raíz del proyecto.
   * *Este script construirá las imágenes, levantará los contenedores en segundo plano y abrirá tu navegador automáticamente en `http://localhost:5173`.*

### Opción B: Ejecución Manual (Desarrollo)
1. Backend: `cd backend` -> `npm install` -> `npm run dev`
2. Frontend: `cd frontend` -> `npm install` -> `npm run dev`

## Decisiones de Diseño
* **Arquitectura Basada en Contenedores (Docker):** El uso de Docker Compose garantiza que el frontend (servido estáticamente por Nginx) y el backend se ejecuten en entornos idénticos aislados.
* **Agente IA:** La lógica de generación no es secuencial estática, sino que está dirigida por un Agente IA (Gemini) que decide dinámicamente qué herramientas ejecutar (inyectar imágenes, llamar a la GPU, validar errores), dotando al backend de comportamiento autónomo.
* **Patrón MVC y Servicios:** La lógica de negocio del servidor se encuentra separada en la capa `services/` (`AgenteService`, `StorageService`, etc.) para mantener los controladores limpios y facilitar la mantenibilidad.
* **Estado Global con Context API:** El estado de sesión del usuario se maneja de manera global en el frontend mediante `AuthContext`, eliminando la necesidad de pasar propiedades (Prop Drilling).
