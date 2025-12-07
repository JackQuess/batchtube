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

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies only
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source code
WORKDIR /app
COPY backend/ ./backend/

# Expose port
EXPOSE 3000

# Default command (can be overridden by Railway Start Command)
CMD ["node", "backend/src/server.js"]

