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
RUN npm run build

# --- Stage 2: Production ---
# WHY nginx:alpine: Battle-tested static file server with reverse proxy
# capability. Alpine variant keeps the image minimal (~25MB).
FROM nginx:alpine

# WHY custom nginx config: Need to proxy /api requests to the backend
# and handle SPA routing (all non-file paths serve index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# WHY copy from build stage: Only the compiled static assets are needed
# in production. No node_modules, no source code, no build tools.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
