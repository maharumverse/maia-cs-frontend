FROM node:20-alpine AS build
WORKDIR /app

# Konfigurasi publik yang ditanam ke bundle. Tidak ada secret di sini: semua nilai VITE_* terlihat
# oleh siapa pun yang membuka aplikasi. Mengubahnya berarti build ulang, bukan deploy ulang.
ARG VITE_API_BASE_URL
ARG VITE_AUTH_MODE
ARG VITE_SSO_LOGIN_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Build gagal bila env tidak valid (vite.config.ts memanggil parseConfig).
RUN npm run build

FROM nginx:1.27-alpine

# Origin API untuk connect-src di CSP. Divalidasi di tahap build sebagai origin murni.
ARG VITE_API_BASE_URL

# Berjalan tanpa root: pid dan cache di tempat yang bisa ditulis user nginx, dan config
# default bawaan image dibuang karena memakai port 80.
RUN rm /etc/nginx/conf.d/default.conf \
 && sed -i -e '/^user /d' -e 's|^pid .*|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
 && chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d

COPY nginx.conf /etc/nginx/templates/default.conf.template
RUN sed -i "s|__API_ORIGIN__|${VITE_API_BASE_URL}|g" /etc/nginx/templates/default.conf.template \
 && ! grep -q "__API_ORIGIN__" /etc/nginx/templates/default.conf.template

COPY docker/10-default-port.envsh /docker-entrypoint.d/10-default-port.envsh
RUN chmod +x /docker-entrypoint.d/10-default-port.envsh

COPY --from=build /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080
