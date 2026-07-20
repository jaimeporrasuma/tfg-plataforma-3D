# Etapa 1: Build
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine

# Copiar el build de Vite a la carpeta pública de nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sobrescribir la configuración por defecto de Nginx para soportar React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
