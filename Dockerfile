# Practical 11: Containerization with Docker - Diya Shah (D25IT118)
FROM node:20-alpine

WORKDIR /app

# Cache layer: install dependencies first
COPY package*.json ./
RUN npm install

# Copy backend source code
COPY . .

# Expose API port
EXPOSE 5000

# Start Express server
CMD ["node", "server.js"]
