# ============================================================
#  frontend/Dockerfile
#  Runs the React development server on port 3000.
#
#  NOTE: This is a dev-server approach — nginx (the separate
#  container) proxies requests to this on port 3000.
#  This means hot-reload works and you can see changes live.
# ============================================================

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY public/ ./public/
COPY src/    ./src/

# React dev server listens on 3000
EXPOSE 3000

# CHOKIDAR_USEPOLLING=true enables file-watch inside Docker on Windows
# Without this, React won't detect file changes
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "start"]
