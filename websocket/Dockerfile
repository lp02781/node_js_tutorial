
# Start from a small Node.js image
FROM node:24-alpine

# Set the working folder inside the container
WORKDIR /app

# Copy package.json first and install packages (skip development packages)
COPY package.json ./
RUN npm install --omit=dev

# Copy the WebSocket server code
COPY server.js ./

# The WebSocket server listens on port 3001
EXPOSE 3001

# Start the WebSocket server
CMD ["node", "server.js"]
