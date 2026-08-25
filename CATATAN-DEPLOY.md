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

## 3. Form pendaftaran

Cloudflare Pages tidak punya penanganan form bawaan, jadi form dikirim ke
Web3Forms (gratis 250 kiriman/bulan).

1. Daftar di https://web3forms.com dengan email pengurus — cukup email,
   tanpa akun/kartu.
2. Salin access key.
3. Di `index.html`, ganti `FORM_ACCESS_KEY = 'GANTI-DENGAN-ACCESS-KEY'`.
4. Ganti juga `WA_NOMOR = '6281234567890'` dengan nomor WhatsApp pengurus,
   format internasional tanpa tanda `+`. Nomor ini juga muncul di dua
   `href="https://wa.me/..."` sebagai cadangan bila JS mati — ganti keduanya.

Kiriman masuk ke email pengurus. Kalau nanti butuh rekap tabel, ganti
`FORM_ENDPOINT` ke Google Apps Script (gratis, tanpa batas, data langsung
ke Spreadsheet).

## 4. Halaman hukum

`kebijakan-privasi.html` dan `syarat-ketentuan.html` sudah terisi, tapi ada
satu placeholder yang wajib dilengkapi sebelum live:

- `kebijakan-privasi.html` bagian 1 — `[LENGKAPI — alamat sekretariat]`

Sebaiknya kedua halaman ditinjau pengurus, dan bila memungkinkan seseorang
yang paham UU PDP No. 27/2022, karena situs ini mengumpulkan data pribadi
anak di bawah umur.

Tema Tailwind dipakai bersama lewat `assets/theme.js` — ubah warna atau
tipografi di satu berkas itu, berlaku ke semua halaman.

## 5. CMS (`/admin`)

Netlify Identity tidak jalan di Cloudflare, jadi backend Decap diganti ke
GitHub OAuth. Di `admin/config.yml` isi:

- `repo:` → sudah diisi `jafarsmi012-ux/web-asbdjabar`
- `base_url:` → URL Worker OAuth

Worker OAuth-nya: https://github.com/sterlingwes/decap-proxy
(deploy sekali sebagai Cloudflare Worker, isi `GITHUB_CLIENT_ID` dan
`GITHUB_CLIENT_SECRET` dari GitHub → Settings → Developer settings →
OAuth Apps).

Editor harus punya akses write ke repo GitHub-nya.
