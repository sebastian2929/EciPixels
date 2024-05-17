# Usa la imagen base de Node.js
FROM node:18.16.0

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia los archivos de configuración de la aplicación
COPY . .

# Instala las dependencias
RUN npm install

# Expón el puerto 4000 para que la aplicación esté accesible externamente
EXPOSE 4000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
