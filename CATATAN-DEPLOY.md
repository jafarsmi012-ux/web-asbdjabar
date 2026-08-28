# Deploy — Cloudflare Pages

Situs statis, tanpa build step. Bandwidth Cloudflare Pages tidak dibatasi,
itu alasan utama memilihnya (hero sequence ~12 MB per pengunjung desktop).

## 1. Deploy

1. Push repo ini ke GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Build command: **kosongkan**. Build output directory: **`/`**.
4. Deploy. Situs hidup di `<nama>.pages.dev`.

## 2. Custom domain (saat domain diganti)

Pages → project → Custom domains → Set up a domain.
Kalau domain sudah di Cloudflare, DNS diisi otomatis. Kalau belum, arahkan
nameserver ke Cloudflare. SSL otomatis, gratis.

Setelah domain final, perbarui yang masih menyebut domain lama:
- `index.html` — blok JSON-LD (`url`, `logo`) dan tag `og:`/`canonical`
- `sitemap.xml`
- `robots.txt`

## 3. Form pendaftaran → Supabase

Data pendaftar disimpan ke Supabase (Postgres). Situs statis menulis langsung
lewat REST API — tanpa backend sendiri. Skala 5.000+ anggota masih di tier
gratis/murah; tidak ada plafon jumlah baris.

### 3a. Setup Supabase (sekali)

1. Buat project di https://supabase.com — pilih region **Singapore**
   (residency data).
2. SQL Editor → tempel isi `supabase/schema.sql` → **Run**. Membuat tabel
   `pendaftar` + Row-Level Security (publik hanya boleh menambah, tidak baca).
3. Settings → API → salin **Project URL** dan **anon public key**.
4. Di `index.html` isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY`. Kedua nilai ini
   memang untuk dipublikasikan — RLS yang menjaga data, bukan kerahasiaan key.
5. Ganti `WA_NOMOR = '6281234567890'` dengan nomor WhatsApp pengurus (format
   internasional tanpa `+`). Nomor ini juga muncul di dua `href="wa.me/..."`
   dan footer sebagai cadangan bila JS mati — ganti semuanya.

Uji setelah deploy (ganti `XXX` + `ANON_KEY`):

    curl -i -X POST 'https://XXX.supabase.co/rest/v1/pendaftar' \
      -H 'apikey: ANON_KEY' -H 'Authorization: Bearer ANON_KEY' \
      -H 'Content-Type: application/json' \
      -d '{"nama_calon":"Uji","nik":"0000000000000000","nama_wali":"Uji","hp_wali":"08123456789","persetujuan_wali":true}'

Harus balas `201`. Lalu `GET` endpoint yang sama harus balas `[]` (baca
ditolak RLS). Hapus baris uji lewat Table Editor.

### 3b. Notifikasi pendaftaran baru

Pilih salah satu:

- **Web3Forms** (email): daftar di https://web3forms.com dengan email pengurus,
  salin access key ke `FORM_ACCESS_KEY` di `index.html`. Ping email terkirim
  otomatis setelah insert berhasil.
- **Database Webhook** (Supabase): Database → Webhooks → webhook `INSERT` pada
  `pendaftar` yang POST ke Telegram/Discord/endpoint email. Tanpa ubah kode.

### 3c. Kelola data & rencana profil

Supabase → Table Editor. Kolom `status` (`baru` → `dihubungi` → `terdaftar`
→ `batal`) untuk menandai progres; ekspor CSV dari situ.

Portal anggota (login mandiri, halaman profil, kartu anggota) menyusul —
saat dibangun: tambah Supabase Auth + policy `select`/`update` untuk role
`authenticated` yang dibatasi ke baris miliknya sendiri. Tidak perlu pindah
database.

## 4. Halaman hukum

`kebijakan-privasi.html` dan `syarat-ketentuan.html` sudah terisi, tapi ada
satu placeholder yang wajib dilengkapi sebelum live:

- `kebijakan-privasi.html` bagian 1 — `[LENGKAPI — alamat sekretariat]`

Sebaiknya kedua halaman ditinjau pengurus, dan bila memungkinkan seseorang
yang paham UU PDP No. 27/2022, karena situs ini mengumpulkan data pribadi
anak di bawah umur.

## 4b. CSS Tailwind (di-build, bukan CDN)

Dulu pakai Tailwind Play CDN (~130 KB JS, generate CSS di browser). Sekarang
di-build jadi `assets/tailwind.css` (~33 KB, ~6 KB terkompresi).

- Warna & tipografi ada di `tailwind.config.js` (dulu `assets/theme.js`).
- **Kalau mengubah kelas Tailwind di `*.html` atau mengubah `tailwind.config.js`:**

      npm install    # sekali
      npm run build  # -> assets/tailwind.css

  lalu commit `assets/tailwind.css`. Edit konten lewat `/admin` TIDAK
  mengubah kelas, jadi tidak perlu build ulang.
- Deploy Cloudflare Pages tetap tanpa build step (CSS-nya sudah di-commit).

## 5. CMS (`/admin`)

Login GitHub OAuth ditangani Pages Function di repo ini
(`functions/auth.js` + `functions/callback.js`) — tanpa Worker terpisah.

Setup sekali, **setelah situs live** di `xxx.pages.dev`:

1. GitHub → Settings → Developer settings → **OAuth Apps** → **New OAuth App**
   - Homepage URL: `https://xxx.pages.dev`
   - Authorization callback URL: `https://xxx.pages.dev/callback`
   - Register → catat **Client ID**, **Generate a new client secret** → catat
2. Cloudflare Pages → project → Settings → **Environment variables**
   (environment: Production), tambah:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
3. `admin/config.yml` → `base_url:` = domain situs sendiri, mis.
   `https://xxx.pages.dev`
4. Commit + push → redeploy. Buka `https://xxx.pages.dev/admin/` →
   **Login with GitHub**.

Uji cepat: buka `https://xxx.pages.dev/auth` di browser — harus langsung
teralihkan ke halaman izin GitHub. Kalau muncul error env var, langkah 2
belum kena.

Akun GitHub yang login harus punya akses **write** ke repo
`jafarsmi012-ux/web-asbdjabar`. Pengurus lain: invite sebagai collaborator
(Settings → Collaborators).

Repo privat perlu scope `repo` (default di `functions/auth.js`). Repo publik
boleh dipersempit ke `public_repo`.
