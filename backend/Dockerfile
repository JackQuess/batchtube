FROM node:20-slim

# 1. Sistem gereksinimlerini kur (Python3 ve FFmpeg şart, Curl indirme için lazım)
RUN apt-get update && \
    apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. yt-dlp'yi doğrudan GitHub'dan en son sürüm olarak indir ve global path'e koy
# Bu yöntem pip'ten daha güvenilirdir çünkü release anında güncellenir.
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp

# 3. Çalıştırma izni ver
RUN chmod a+rx /usr/local/bin/yt-dlp

# Çalışma dizini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Node modüllerini kur
RUN npm ci --only=production

# 4. Uygulama kodunu kopyala
# ÖNEMLİ: .dockerignore dosyasında 'bin' klasörünün veya 'node_modules'un olduğundan emin ol
COPY . .

# Portu aç
EXPOSE 3000

# Uygulamayı başlat
CMD ["node", "src/server.js"]