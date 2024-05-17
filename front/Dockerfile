# Usa la imagen de Node.js como base
FROM node:18.16.0 AS build

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia los archivos del proyecto Angular
COPY . .

# Instala las dependencias
RUN npm install

# Construye la aplicación Angular en modo de producción
RUN npm run build -- --configuration=production

# Segunda etapa: Usa una imagen ligera de Nginx para servir los archivos de la aplicación
FROM nginx:alpine

# Copia los archivos estáticos de la primera etapa
COPY --from=build /app/dist/* /usr/share/nginx/html/

# Expón el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
