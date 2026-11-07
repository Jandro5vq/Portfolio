FROM node:22-alpine
WORKDIR /app
COPY server.js .
# El volumen se crea con el dueño de esta carpeta: así el usuario node puede escribir en él
RUN mkdir /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
