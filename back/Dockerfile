FROM node:18.16.0

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia package.json y package-lock.json antes de instalar dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Crea un usuario y grupo no root
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Cambia la propiedad de los archivos al nuevo usuario
RUN chown -R appuser:appuser /app

# Cambia al nuevo usuario no root
USER appuser

# Expón el puerto 4000 para que la aplicación esté accesible externamente
EXPOSE 4000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
