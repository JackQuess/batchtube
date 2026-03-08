# Root Dockerfile: only valid when build context is REPO ROOT (Root Directory empty).
# If you see "COPY api/ not found" → Railway context is the api folder. Set Root Directory to "api"
# so Railway uses api/Dockerfile instead (no "api/" in paths).
FROM node:20-slim

RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir -U yt-dlp && \
    ln -sf /usr/local/bin/yt-dlp /usr/bin/yt-dlp && \
    yt-dlp --version

WORKDIR /app

COPY api/ ./
RUN npm install && npx prisma generate && npm run build

EXPOSE 8080
CMD ["node", "dist/server.js"]
