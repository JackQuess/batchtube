FROM node:20-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip (more reliable updates) + verify
RUN python3 -m pip install --no-cache-dir -U yt-dlp && \
    ln -sf /usr/local/bin/yt-dlp /usr/bin/yt-dlp && \
    yt-dlp --version

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
