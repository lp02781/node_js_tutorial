# API only - the Next.js frontend runs in its own container (frontend/Dockerfile)
FROM node:24-alpine

WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend/server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
