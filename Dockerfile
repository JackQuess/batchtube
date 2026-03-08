# Root Dockerfile: builds the api app when build context is repo root (e.g. Railway worker with no root dir).
# For api/ and worker services, prefer Root Directory = "api" so api/Dockerfile (Alpine + yt-dlp_musllinux) is used.
FROM node:20-slim

RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir -U yt-dlp && \
    ln -sf /usr/local/bin/yt-dlp /usr/bin/yt-dlp && \
    yt-dlp --version

WORKDIR /app

COPY api/package.json api/package-lock.json* ./
RUN npm install

COPY api/ ./
RUN npx prisma generate && npm run build

EXPOSE 8080
CMD ["node", "dist/server.js"]
