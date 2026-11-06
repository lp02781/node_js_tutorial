
FROM node:24-alpine

WORKDIR /app

COPY backend/package.json ./backend/package.json

WORKDIR /app/backend
RUN npm install --omit=dev

WORKDIR /app

COPY backend/server.js ./backend/server.js
COPY frontend ./frontend

EXPOSE 3000

CMD ["node", "backend/server.js"]
