# Railway build: Worker & API

## Root Directory = `api` (batchtube & worker)

**Her iki serviste de Root Directory `/api` ise** build context sadece `api/` klasörünün içeriğidir. Railway bu durumda **`api/Dockerfile`** kullanmalı (içinde `COPY . ./` var, `api/` yok).

Eğer hâlâ "COPY api/ not found" alıyorsan, Railway bazen repo kökündeki Dockerfile’ı seçiyor demektir. Bunu engellemek için repo kökünde artık **`Dockerfile` yok**; sadece **`Dockerfile.reporoot`** var. Böylece Root Directory = `api` iken sadece `api/Dockerfile` kullanılır.

## Repo yapısı

- **API (ve worker) kaynağı:** `api/`
- **api/Dockerfile:** Context = `api/` klasörü → `COPY . ./`
- **Dockerfile.reporoot:** Sadece context = repo kökü için (yerel: `docker build -f Dockerfile.reporoot .`)

## Özet

| Root Directory | Kullanılan Dockerfile | COPY |
|----------------|------------------------|------|
| `api`          | api/Dockerfile        | COPY . ./ |
| *(boş)*       | Dockerfile yok → Nixpacks veya Dockerfile.reporoot (path belirtirsen) | - |

**batchtube ve worker için Root Directory = `api`** kullan; böylece `api/Dockerfile` (Alpine + yt-dlp) devreye girer.
