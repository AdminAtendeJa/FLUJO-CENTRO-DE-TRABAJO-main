FROM nginx:alpine

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_SERVICE_KEY

COPY index.html /usr/share/nginx/html/index.html
COPY app.js /usr/share/nginx/html/app.js
COPY clientes.js /usr/share/nginx/html/clientes.js
COPY entradas.js /usr/share/nginx/html/entradas.js
COPY gastos.js /usr/share/nginx/html/gastos.js
COPY router.js /usr/share/nginx/html/router.js
COPY utils.js /usr/share/nginx/html/utils.js
COPY styles.css /usr/share/nginx/html/styles.css
COPY config.template.js /etc/dashboard/config.template.js
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
