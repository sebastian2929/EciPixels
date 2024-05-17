FROM node:18.16.0

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia solo los archivos necesarios de la aplicación
COPY package*.json ./

# Instala las dependencias
RUN npm install --ignore-scripts

# Crea directorios para la aplicación
RUN mkdir src
RUN mkdir public
RUN mkdir views
# Agrega cualquier otro directorio necesario aquí

# Copia el contenido de cada directorio
COPY src/ ./src/
COPY public/ ./public/
COPY views/ ./views/

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
