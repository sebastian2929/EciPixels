# Primera etapa: Construcción de la aplicación Angular
FROM node:18.16.0 AS build

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia solo los archivos necesarios
COPY package*.json ./

# Instala las dependencias
RUN npm install --ignore-scripts

# Copia los archivos del proyecto Angular necesarios para la construcción
COPY src/ ./src/
COPY angular.json .
COPY tsconfig.json .
COPY tslint.json .
# Agrega cualquier otro archivo necesario para la construcción de Angular

# Construye la aplicación Angular en modo de producción
RUN npm run build -- --configuration=production

# Segunda etapa: Usa una imagen ligera de Nginx para servir los archivos de la aplicación
FROM nginx:alpine

# Crea un usuario y grupo no root
RUN addgroup -S appuser && adduser -S -G appuser appuser

# Copia los archivos estáticos construidos en la primera etapa
COPY --from=build /app/dist /usr/share/nginx/html

# Cambia la propiedad de los archivos a appuser
RUN chown -R appuser:appuser /usr/share/nginx/html

# Cambia al nuevo usuario no root
USER appuser

# Expone el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
