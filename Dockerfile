# Root Dockerfile: builds the api app when build context is repo root.
# For worker/API on Railway, set Root Directory = "api" so api/Dockerfile (Alpine + yt-dlp) is used instead.
FROM node:20-slim

RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir -U yt-dlp && \
    ln -sf /usr/local/bin/yt-dlp /usr/bin/yt-dlp && \
    yt-dlp --version

WORKDIR /app

# Single COPY to avoid cache checksum issues; then install and build
COPY api/ ./
RUN npm install && npx prisma generate && npm run build

EXPOSE 8080
CMD ["node", "dist/server.js"]
