
# Start from a small Node.js image
FROM node:24-alpine

# Set the main working folder inside the container
WORKDIR /app

# Copy only package.json first, so Docker can cache the install step
COPY backend/package.json ./backend/package.json

# Install the backend packages (skip development packages)
WORKDIR /app/backend
RUN npm install --omit=dev

# Go back to the main folder
WORKDIR /app

# Copy the backend code and the frontend files
COPY backend/server.js ./backend/server.js
COPY frontend ./frontend

# The backend listens on port 3000
EXPOSE 3000

# Start the backend server
CMD ["node", "backend/server.js"]
