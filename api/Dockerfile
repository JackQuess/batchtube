FROM node:20-alpine
# Worker needs yt-dlp (standalone binary, no Python required) and ffmpeg for merge/convert
RUN apk add --no-cache ffmpeg wget && \
  wget -q -O /usr/local/bin/yt-dlp "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_musllinux" && \
  chmod +x /usr/local/bin/yt-dlp && \
  yt-dlp --version && \
  ffmpeg -version | head -1 && \
  apk del wget
WORKDIR /app
RUN mkdir -p /app/cookies
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run prisma:generate && npm run build
EXPOSE 8080
CMD ["npm", "run", "start"]
