# Dockerfile para el GPU Worker (Puente API)
FROM node:22-alpine

WORKDIR /usr/src/app

# Copiar dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar el código fuente (index.js, workflow.json, etc.)
COPY . .

# El servidor puente escucha en el 3001
EXPOSE 3001

CMD [ "node", "server.js" ]