-- ASBD Jawa Barat — penyimpanan pendaftar anggota baru.
-- Jalankan sekali di Supabase → SQL Editor. Region project: Singapore.

create table if not exists public.pendaftar (
  id               uuid primary key default gen_random_uuid(),
  dibuat           timestamptz not null default now(),
  status           text not null default 'baru',   -- baru | dihubungi | terdaftar | batal

  nama_calon       text not null,
  nik              text not null,
  tempat_lahir     text,
  tanggal_lahir    date,
  sekolah_kelas    text,
  golongan_darah   text,
  berat_badan      numeric(4,1),
  tinggi_badan     integer,
  cabang_latihan   text,

  nama_wali        text not null,
  hp_wali          text not null,
  email_wali       text,
  catatan          text,
  persetujuan_wali boolean not null
);

create index if not exists pendaftar_status_idx on public.pendaftar (status);
create index if not exists pendaftar_dibuat_idx on public.pendaftar (dibuat desc);

-- Row-Level Security: publik (anon) HANYA boleh menambah, dengan validasi minimum.
-- Tanpa policy select/update/delete, operasi itu otomatis ditolak untuk anon —
-- jadi anon key boleh dipublikasikan di situs. Pengurus mengakses data lewat
-- dashboard Supabase (service role, bypass RLS); portal anggota ber-login
-- ditambahkan policy select-nya nanti.
alter table public.pendaftar enable row level security;

drop policy if exists "publik boleh mendaftar" on public.pendaftar;
create policy "publik boleh mendaftar" on public.pendaftar
  for insert to anon
  with check (
    persetujuan_wali = true
    and length(nama_calon) between 2 and 120
    and nik ~ '^[0-9]{16}$'
    and length(hp_wali) between 8 and 20
  );

-- Notifikasi pendaftaran baru (opsional, pilih salah satu):
--  a) FORM_ACCESS_KEY di index.html  -> ping email via Web3Forms setelah insert.
--  b) Database -> Webhooks -> webhook INSERT pada pendaftar yang POST ke
--     Telegram/Discord/endpoint email. Tidak perlu ubah kode situs.
