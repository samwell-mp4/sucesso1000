# Stage 1: Build Frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Backend & Serve
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy built frontend assets to backend's public folder
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
