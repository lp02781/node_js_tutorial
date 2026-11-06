# Stage 1: build the React frontend into static files (frontend/dist)
FROM node:24-alpine AS frontend

WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Stage 2: Node backend, serving the built frontend
FROM node:24-alpine

WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend/server.js ./

COPY --from=frontend /app/frontend/dist /app/frontend/dist

WORKDIR /app

EXPOSE 3000

CMD ["node", "backend/server.js"]
