FROM node:20-bookworm-slim

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3, sharp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy root package files and install
COPY package.json package-lock.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy client package files and install
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci || cd client && npm install

# Copy all source code
COPY . .

# Build frontend
RUN cd client && npx vite build

# Create necessary directories
RUN mkdir -p server/uploads server/db

ENV NODE_ENV=production

EXPOSE ${PORT:-3001}

CMD ["node", "server/index.js"]
