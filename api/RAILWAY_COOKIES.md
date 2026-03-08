# Railway’da Worker İçin Cookie Dosyası (YouTube)

Worker’ın age-restricted / login-required YouTube indirmeleri yapabilmesi için `cookies.txt` dosyasının container içinde olması gerekir. İki yöntem var.

---

## Yöntem 1: COOKIES_INIT_URL (Önerilen – tek sefer kurulum)

Cookie dosyasını **gizli bir URL’den** sunarsın; worker ilk açılışta oradan indirir ve `/app/cookies/cookies.txt` olarak yazar.

### Adımlar

1. **Cookie dosyasını güvenli bir yere koy**
   - **Seçenek A – GitHub Gist (gizli):**  
     - https://gist.github.com → New gist  
     - “Secret Gist” seç  
     - Dosya adı: `cookies.txt`  
     - İçeriği yapıştır (tarayıcıdan export ettiğin Netscape formatı)  
     - Create secret gist  
     - “Raw” butonuna tıkla; URL’i kopyala (örn. `https://gist.githubusercontent.com/KULLANICI/HASH/raw/.../cookies.txt`)
   - **Seçenek B – Kendi sunucun / S3:**  
     Dosyayı bir URL’den indirilebilir yap (şifre veya presigned URL ile koruyabilirsin).

2. **Railway’de Worker servisini seç**  
   → **Variables** sekmesi.

3. **Şu değişkenleri ekle:**

   | Değişken | Değer |
   |----------|--------|
   | `YT_DLP_COOKIES_FILE` | `/app/cookies/cookies.txt` |
   | `COOKIES_INIT_URL` | Cookie dosyasının **raw** URL’i (Gist raw veya kendi sunucunun URL’i) |

4. **Deploy et.**  
   Worker ayağa kalktığında dosya yoksa `COOKIES_INIT_URL`’den indirir ve `/app/cookies/cookies.txt` olarak yazar. Log’da `cookie_init_done` görürsün.

**Not:** Her yeni deploy’da container sıfırdan oluştuğu için dosya yine yok sayılır ve **yeniden indirilir**. URL hep erişilebilir olsun (Gist’i silme).

---

## Yöntem 2: Volume (Dosya deploy’da kaybolmasın istersen)

Cookie dosyasını container’ın **volume**’üne koyarsın; böylece deploy’lar arasında silinmez.

### Adımlar

1. **Railway’de Worker servisi** → **Settings** → **Volumes**.
2. **Add Volume:**  
   - Mount Path: `/app/cookies`
3. **Variables’da ekle:**  
   - `YT_DLP_COOKIES_FILE` = `/app/cookies/cookies.txt`
4. **İlk kez dosyayı volume’e yazmak için:**
   - Railway CLI kur: `npm i -g @railway/cli`
   - Projede: `railway link` (projeyi seç, worker servisini seç)
   - Bir kez çalıştır:
     ```bash
     railway run sh -c 'echo "# Netscape
     .youtube.com	TRUE	/	TRUE	9999999999	TEST	value" > /app/cookies/cookies.txt'
     ```
     Bu sadece test satırı. Gerçek cookie’leri koymak için:
   - Cookie dosyanı bir URL’e koy (Gist vs.), sonra:
     ```bash
     railway run sh -c 'wget -q -O /app/cookies/cookies.txt "BURAYA_RAW_URL_YAPIŞTIR"'
     ```
   - veya local’de `cookies.txt` hazırsa (dikkat: içinde gerçek cookie var, paylaşma):
     ```bash
     railway run sh -c 'cat > /app/cookies/cookies.txt' < /Users/osmankayraalkan/Downloads/youtube.txt
     ```
     (Railway run’da stdin’in volume’e yazılıp yazılmadığını test et; çalışmazsa Yöntem 1’i kullan.)

5. **Redeploy** et. Worker artık `/app/cookies/cookies.txt` dosyasını volume’den okur.

---

## Özet

| | Yöntem 1 (COOKIES_INIT_URL) | Yöntem 2 (Volume) |
|---|-----------------------------|-------------------|
| Kurulum | Sadece iki env değişkeni | Volume + bir kere dosyayı yazma |
| Her deploy | URL’den tekrar indirir | Dosya volume’de kalır |
| Cookie güncelleme | Gist/dosyayı güncelle, redeploy | Volume’e yeniden yaz veya Yöntem 1’e geç |

Pratik seçenek: **Yöntem 1**. Gizli Gist’e `cookies.txt` at, raw URL’i `COOKIES_INIT_URL` ve `YT_DLP_COOKIES_FILE=/app/cookies/cookies.txt` yap, deploy et.
