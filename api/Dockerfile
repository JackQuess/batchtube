FROM node:20-alpine
# Alpine uses musl libc → use yt-dlp_musllinux (yt-dlp_linux is glibc)
RUN apk add --no-cache ffmpeg wget && \
  wget -q -O /usr/local/bin/yt-dlp "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_musllinux" && \
  chmod +x /usr/local/bin/yt-dlp && \
  yt-dlp --version && \
  apk del wget
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run prisma:generate && npm run build
EXPOSE 8080
CMD ["npm", "run", "start"]
