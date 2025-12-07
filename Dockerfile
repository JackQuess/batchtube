FROM node:20-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download yt-dlp from GitHub release
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Set working directory to /app/backend
WORKDIR /app/backend

# Copy package files
COPY backend/package.json backend/package-lock.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Expose port
EXPOSE 3000

# Default command (backend server)
# Worker service will override with: node src/worker.js
CMD ["node", "src/server.js"]
