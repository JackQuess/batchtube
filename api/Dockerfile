FROM node:20-alpine
# yt-dlp: use Linux PyInstaller binary so we don't need Python (generic 'yt-dlp' can be zipimport script)
RUN apk add --no-cache ffmpeg wget && \
  wget -q -O /usr/local/bin/yt-dlp "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" && \
  chmod +x /usr/local/bin/yt-dlp && \
  apk del wget
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run prisma:generate && npm run build
EXPOSE 8080
CMD ["npm", "run", "start"]
