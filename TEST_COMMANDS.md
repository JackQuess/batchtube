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
npm install -g @batchtube/cli
```
Kurulumdan sonra `batchtube` komutu global kullanılabilir.

---

## 2. API key ile CLI testi

Hesabında **Archivist** veya **Enterprise** planı olan bir kullanıcıyla API key oluştur (web arayüzünden veya DB üzerinden). API key `bt_live_...` ile başlamalı.

### Login
```bash
batchtube login
```
- API base URL: `http://localhost:3000` (API’nin çalıştığı adres)
- API key: `bt_live_xxxxxxxx...`

### Whoami (plan / kredi)
```bash
batchtube whoami
batchtube whoami --json
```

### Tek link download
```bash
batchtube download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
batchtube download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --format mp3 --zip
```

### Batch (dosyadan veya birden fazla URL)
```bash
echo "https://www.youtube.com/watch?v=dQw4w9WgXcQ" > urls.txt
batchtube batch urls.txt
batchtube batch "https://youtube.com/watch?v=abc" "https://tiktok.com/..."
```

### Status
```bash
# Önceki komuttan dönen batch id'yi kullan (UUID)
batchtube status <BATCH_UUID>
batchtube status <BATCH_UUID> --json
```

### Dosya listesi (GET /v1/files)
```bash
batchtube files
batchtube files --json
```

### Dosya indirme linki
```bash
# files veya status/items’tan alınan file id
batchtube download-file <FILE_UUID>
batchtube download-file <FILE_UUID> --json
```

### Logout
```bash
batchtube logout
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
batchtube logout
batchtube whoami
# Beklenen: "Run \`batchtube login\` first." ve exit 1
```

---

## 6. Global override (farklı API adresi)

```bash
batchtube --api http://localhost:3000 whoami
batchtube --api https://api.batchtube.net status <BATCH_UUID>
```

---

**Özet:** Önce API’yi ayağa kaldır, `npm install -g @batchtube/cli` ile CLI’yı kur, sonra `batchtube login` ile giriş yapıp yukarıdaki komutları dene. Loglarda `auth_resolved` ve `authType: 'api_key'` veya `authType: 'jwt'` göreceksin.
