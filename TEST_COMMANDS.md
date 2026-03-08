# BatchTube CLI ve API – Test Komutları

Değişiklikler GitHub’a push edildi: `origin/main` (JackQuess/batchtube).

---

## 1. Ortam hazırlığı

### API’yi çalıştır
```bash
cd api
cp .env.example .env   # gerekirse düzenle (DATABASE_URL, REDIS_URL, SUPABASE_*)
npm install
npm run build
npm start
# veya: npx tsx src/server.ts
```
API varsayılan olarak bir portta (örn. 3000) çalışacak. `.env` içindeki `PORT`’u not al.

### CLI’yi hazırla
```bash
cd cli
npm install
npm run build
```

---

## 2. API key ile CLI testi

Hesabında **Archivist** veya **Enterprise** planı olan bir kullanıcıyla API key oluştur (web arayüzünden veya DB üzerinden). API key `bt_live_...` ile başlamalı.

### Login
```bash
cd cli
node dist/index.js login
```
- API base URL: `http://localhost:3000` (API’nin çalıştığı adres)
- API key: `bt_live_xxxxxxxx...`

### Whoami (plan / kredi)
```bash
node dist/index.js whoami
node dist/index.js whoami --json
```

### Tek link download
```bash
node dist/index.js download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
node dist/index.js download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --format mp3 --zip
```

### Batch (dosyadan veya birden fazla URL)
```bash
echo "https://www.youtube.com/watch?v=dQw4w9WgXcQ" > urls.txt
node dist/index.js batch urls.txt
node dist/index.js batch "https://youtube.com/watch?v=abc" "https://tiktok.com/..."
```

### Status
```bash
# Önceki komuttan dönen batch id'yi kullan (UUID)
node dist/index.js status <BATCH_UUID>
node dist/index.js status <BATCH_UUID> --json
```

### Dosya listesi (GET /v1/files)
```bash
node dist/index.js files
node dist/index.js files --json
```

### Dosya indirme linki
```bash
# files veya status/items’tan alınan file id
node dist/index.js download-file <FILE_UUID>
node dist/index.js download-file <FILE_UUID> --json
```

### Logout
```bash
node dist/index.js logout
```

---

## 3. curl ile API testi (API key)

`YOUR_API_KEY` ve `API_BASE` (örn. http://localhost:3000) değiştir.

### Account usage
```bash
curl -s -H "Authorization: Bearer YOUR_API_KEY" "http://localhost:3000/v1/account/usage" | jq
```

### Batch oluştur
```bash
curl -s -X POST "http://localhost:3000/v1/batches" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],"options":{"format":"mp4","quality":"best"},"auto_start":true}' | jq
```

### Batch status
```bash
curl -s -H "Authorization: Bearer YOUR_API_KEY" "http://localhost:3000/v1/batches/BATCH_UUID" | jq
```

### Dosya listesi (GET /v1/files)
```bash
curl -s -H "Authorization: Bearer YOUR_API_KEY" "http://localhost:3000/v1/files" | jq
curl -s -H "Authorization: Bearer YOUR_API_KEY" "http://localhost:3000/v1/files?page=1&limit=10" | jq
```

### Dosya indirme linki
```bash
curl -s -H "Authorization: Bearer YOUR_API_KEY" "http://localhost:3000/v1/files/FILE_UUID/download" | jq
```

---

## 4. Web uygulaması (JWT) testi

Tarayıcıda giriş yap; batch oluştur, detay aç, hesap kullanımına bak. Her şey eskisi gibi çalışmalı. API loglarında bu istekler için `authType: 'jwt'` görünmeli.

---

## 5. Hata senaryoları

### Geçersiz API key
```bash
curl -s -H "Authorization: Bearer bt_live_invalid" "http://localhost:3000/v1/account/usage"
# Beklenen: 401
```

### Free/Pro plan ile API key
```bash
# Free veya Pro kullanıcıya ait API key ile
curl -s -H "Authorization: Bearer bt_live_..." "http://localhost:3000/v1/account/usage"
# Beklenen: 403, "API access requires Archivist or Enterprise"
```

### Login olmadan CLI
```bash
node dist/index.js logout
node dist/index.js whoami
# Beklenen: "Run \`batchtube login\` first." ve exit 1
```

---

## 6. Global override (farklı API adresi)

```bash
node dist/index.js --api http://localhost:3000 whoami
node dist/index.js --api https://api.batchtube.net status <BATCH_UUID>
```

---

**Özet:** Önce API’yi ayağa kaldır, sonra `cli` içinde `node dist/index.js login` ile giriş yapıp yukarıdaki komutları sırayla dene. Loglarda `auth_resolved` ve `authType: 'api_key'` veya `authType: 'jwt'` göreceksin.
