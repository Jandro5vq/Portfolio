# Web estática: no hay paso de compilación, nginx sirve los archivos tal cual.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
EXPOSE 80
