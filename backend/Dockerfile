FROM node:22-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto (el backend usa el 4000)
EXPOSE 4000

# Comando para iniciar
CMD [ "npm", "start" ]
