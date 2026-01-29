# WHY multi-stage build: Stage 1 installs ~300MB of node_modules and build
# tools. Stage 2 copies only the built static files (~5MB) into nginx.
# Final image is ~25MB instead of ~350MB.

# --- Stage 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# WHY copy package files first: Docker layer caching. npm install only
# reruns when dependencies change, not on every code change.
COPY package*.json ./
RUN npm ci
# WHY npm ci over npm install: Deterministic builds from lockfile.
# Fails if lockfile is out of sync with package.json (catches errors early).

# Copy source and build
COPY . .
# WHY: VERSION file from repo root is copied by docker compose build context.
# If missing, vite falls back to 'dev'. See vite.config.ts loadVersion().
ARG APP_VERSION=dev
RUN echo "$APP_VERSION" > VERSION && npm run build

# --- Stage 2: Production ---
# WHY nginxinc/nginx-unprivileged:alpine: Same as nginx:alpine but runs as
# non-root user (uid 101). Security best practice - limits blast radius if
# the container is compromised. Requires listening on port >= 1024.
FROM nginxinc/nginx-unprivileged:alpine

# WHY custom nginx config: Need to proxy /api requests to the backend
# and handle SPA routing (all non-file paths serve index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# WHY copy from build stage: Only the compiled static assets are needed
# in production. No node_modules, no source code, no build tools.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
