FROM node:18-alpine

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install project dependencies
RUN npm install --ignore-scripts

# Copy application source code
COPY . .

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start TestPilot REST Server
CMD ["node", "src/server.js"]
