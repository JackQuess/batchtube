# CORS – api.batchtube.net

Frontend `https://batchtube.net` veya `https://www.batchtube.net` adresinden API’ye (`https://api.batchtube.net`) istek attığında tarayıcı CORS kurallarını kontrol eder. **API sunucusunda doğru origin’lerin izinli olması gerekir.**

## Ne yapmalısın?

### 1. API’nin çalıştığı yerde (Railway / VPS / vb.) ortam değişkenlerini kontrol et

API servisinin **ortam değişkenlerinde** şunlardan biri mutlaka tanımlı olmalı:

**Seçenek A – Tek tek origin’ler (tercih edilen):**
```bash
ALLOWED_ORIGIN=https://batchtube.net
ALLOWED_ORIGIN_2=https://www.batchtube.net
```

**Seçenek B – Virgülle ayrılmış liste:**
```bash
CORS_ALLOWED_ORIGINS=https://batchtube.net,https://www.batchtube.net
```

- `ALLOWED_ORIGIN` veya `ALLOWED_ORIGIN_2` **boş bırakılmamalı**. Boşsa CORS izin listesine eklenmez ve “No 'Access-Control-Allow-Origin' header” hatası alırsın.
- Kod tarafında varsayılan değerler zaten `https://batchtube.net` ve `https://www.batchtube.net`. Yine de production’da bu değişkenleri **açıkça** set etmek iyi olur.

### 2. API servisini yeniden başlat

Ortam değişkenlerini ekledikten veya değiştirdikten sonra API’yi yeniden deploy et / restart et ki yeni CORS ayarları yüklensin.

### 3. Tarayıcıda test et

- `https://batchtube.net` veya `https://www.batchtube.net` adresini aç.
- Geliştirici araçları → Network sekmesinden `/v1/batches` (veya başka bir API isteği) isteğine tıkla.
- Response headers’da şunu görmelisin:  
  `Access-Control-Allow-Origin: https://batchtube.net` (veya kullandığın origin).

## Hata: “No 'Access-Control-Allow-Origin' header is present”

Bu genelde şu anlama gelir:

1. **Origin izin listesinde yok**  
   API’de `ALLOWED_ORIGIN` / `ALLOWED_ORIGIN_2` veya `CORS_ALLOWED_ORIGINS` içinde frontend’in tam adresi (örn. `https://batchtube.net`) yok. Yukarıdaki değişkenleri ekleyip API’yi yeniden başlat.

2. **OPTIONS (preflight) başarısız**  
   CORS preflight OPTIONS isteği 404/5xx alıyorsa tarayıcı CORS header’larını göremez. API’nin `/v1/*` route’larına OPTIONS ile cevap verebildiğinden emin ol (Fastify CORS eklentisi bunu yapar; eklenti kayıtlı ve route’lardan önce yükleniyorsa sorun olmaz).

3. **Yanlış domain / protokol**  
   Frontend’in açık olduğu adres tam olarak izin verdiğin origin ile aynı olmalı (sonunda `/` olup olmaması, `http` vs `https` farkı önemli). Örn. frontend `https://batchtube.net` ise listede de `https://batchtube.net` olmalı.

## Railway örneği

1. Railway dashboard → API servisi → **Variables**.
2. Ekle / güncelle:
   - `ALLOWED_ORIGIN` = `https://batchtube.net`
   - `ALLOWED_ORIGIN_2` = `https://www.batchtube.net`
3. **Redeploy** veya **Restart** ile servisi yeniden başlat.

Bu adımlardan sonra CORS hatası kaybolmalı; hâlâ devam ederse tarayıcıdaki tam hata mesajı ve isteğin Request/Response header’larını paylaşırsan bir sonraki adımı netleştirebiliriz.
