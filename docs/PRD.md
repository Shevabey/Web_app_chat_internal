# PRD — Akselera.Tech Internal Chat

| | |
|---|---|
| **Versi** | 1.0 (siap eksekusi) |
| **Sumber** | `Task-Vibes-Programmer-AkseleraTech.pdf` (Technical Task Vibes Programmer) |
| **Durasi** | 3 × 24 jam sejak task diterima |
| **Dokumen terkait** | [ARCHITECTURE.md](./ARCHITECTURE.md) · [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) · [PROGRESS.md](./PROGRESS.md) |

> Dokumen ini adalah **sumber kebenaran untuk "apa yang dibuat"**. Bila ada konflik dengan dokumen lain, PRD menang untuk perilaku produk, ARCHITECTURE menang untuk keputusan teknis.

---

## 1. Ringkasan & Tujuan

Akselera.Tech akan membangun CRM internal yang menghubungkan WhatsApp API ke satu platform. Task ini menguji **fondasinya: fitur chat internal 1-on-1**. Integrasi WhatsApp **tidak** termasuk.

**Tujuan produk:** web app chat dua panel (daftar chat di kiri, percakapan di kanan) yang berfungsi benar, aman, bermerek Akselera.Tech, dan bisa dipakai di light maupun dark mode.

**Tujuan kandidat (implisit dari penilaian):** menunjukkan kemampuan membangun fitur end-to-end yang **aman by design** (bukan sekadar tampil benar), rapi, dan bisa dijelaskan saat interview.

## 2. Ruang Lingkup

### In scope (wajib)
Login/logout · Add new chat · Kirim/terima pesan teks · Daftar chat · Isolasi data antar akun · Light/dark mode · Brand Akselera.Tech.

### In scope (bonus — diputuskan dikerjakan semua)
Realtime · Registrasi mandiri · Tema tersimpan · Penanda belum dibaca · Pencarian chat · Status online · Layar ponsel.

### Out of scope (JANGAN dikerjakan, "sederhana, tidak perlu fitur tambahan")
Integrasi WhatsApp · Group chat · Lampiran/gambar/file · Edit/hapus pesan · Indikator mengetik · Push notification · Edit profil · Reset password · Multi-bahasa · PWA/offline.

## 3. Kriteria Penilaian → Implikasi Prioritas

| # | Kriteria (urut prioritas dari PDF) | Implikasi |
|---|---|---|
| 1 | Berfungsi sesuai fitur wajib | 7 fitur wajib harus 100% jalan sebelum menyentuh bonus |
| 2 | **Keamanan akses data** + penanganan secret | Isolasi di level database (RLS), bukan hanya UI. Secret tidak boleh bocor ke repo/browser |
| 3 | Kerapian kode, README, alasan infrastruktur | Struktur jelas, README lengkap, alasan pemilihan Supabase/Vercel tertulis |
| 4 | Kesesuaian brand (light & dark) | Logo, Nunito, hitam-putih + abu netral |
| 5 | Bonus | Dikerjakan setelah 1–4 aman |

**Urutan kerja:** Wajib → Keamanan → Deploy & README → Brand polish → Bonus.

## 4. Pengguna & Skenario

**Persona:** karyawan internal Akselera.Tech (Andi, Maya, Rina, …) yang berkomunikasi 1-on-1. Diasumsikan pengguna desktop utama, ponsel sebagai bonus.

Skenario inti:
1. Andi membuka `/chat` tanpa login → diarahkan ke `/login`.
2. Andi login → melihat daftar chat miliknya.
3. Andi klik **+ Chat baru** → memilih Maya → **Mulai chat** → percakapan terbuka.
4. Andi mengirim pesan; Maya (akun lain) menerima; refresh/login ulang tetap ada.
5. Pihak ketiga (Rina) **tidak bisa** membaca percakapan Andi–Maya, termasuk lewat panggilan API langsung.

## 5. Requirements Fungsional (Wajib)

Setiap requirement punya **Acceptance Criteria (AC)** yang harus lulus sebelum ditandai selesai di PROGRESS.md.

### FR-1 — Login & Logout *(PDF wajib #1, aturan A)*
- **AC-1.1** Membuka `/chat` atau `/chat/:id` tanpa sesi → dialihkan ke `/login` (server-side, bukan sekadar sembunyi di UI).
- **AC-1.2** Email + password benar → masuk ke `/chat`.
- **AC-1.3** Kredensial salah → tetap di `/login` dengan pesan **generik** "Email atau password salah" (tidak membocorkan apakah email terdaftar). Tidak ada sesi terbentuk.
- **AC-1.4** Tombol logout mengakhiri sesi dan kembali ke `/login`. Tombol *Back* browser tidak menampilkan data chat pengguna sebelumnya.
- **AC-1.5** Pengguna yang sudah login membuka `/login` → dialihkan ke `/chat`.
- **AC-1.6** Redirect pasca-login (`?next=`) hanya menerima path relatif internal (cegah open redirect).

### FR-2 — Add New Chat *(PDF wajib #2, aturan B)*
- **AC-2.1** Tombol **+ Chat baru** membuka dialog berisi pengguna terdaftar **tanpa akun yang sedang login**.
- **AC-2.2** Ada kolom cari nama/email; pilih tepat satu pengguna (radio); tombol **Mulai chat** nonaktif sampai ada pilihan; tombol **Tutup** tersedia.
- **AC-2.3** Bila percakapan dengan pengguna itu sudah ada → membuka yang lama (tidak membuat duplikat).
- **AC-2.4** Validasi **di server/database**: lawan bicara harus pengguna terdaftar dan bukan diri sendiri. Memanggil API dengan UUID sembarang/dirinya sendiri ditolak.

### FR-3 — Kirim & Terima Pesan Teks *(PDF wajib #3, aturan C)*
- **AC-3.1** Kirim pesan teks (1–2000 karakter setelah trim; pesan kosong ditolak). `Enter` kirim, `Shift+Enter` baris baru.
- **AC-3.2** Pesan tersimpan di database; setelah refresh atau logout→login ulang, riwayat tetap ada dengan urutan benar.
- **AC-3.3** Akun penerima melihat pesan (minimal setelah refresh; realtime = bonus B-1).
- **AC-3.4** Pesan ditampilkan sebagai **teks polos** (tidak ada HTML injection/XSS).
- **AC-3.5** Riwayat besar dimuat bertahap (50 pesan terakhir, muat lebih lama saat scroll ke atas).
- **AC-3.6** Pesan gagal terkirim ditandai jelas dan bisa dicoba ulang; tidak hilang diam-diam.

### FR-4 — Daftar Chat *(PDF wajib #4, aturan D)*
- **AC-4.1** Setiap item: **nama lawan bicara**, **cuplikan pesan terakhir**, **waktu** (mis. `09.42`, `Kemarin`, `Senin`).
- **AC-4.2** Urut berdasarkan pesan terakhir (terbaru di atas).
- **AC-4.3** Hanya berisi percakapan milik akun yang login.
- **AC-4.4** Empty state jelas: "Pilih percakapan atau mulai chat baru".

Aturan format waktu (zona **Asia/Jakarta**, locale `id-ID`): hari ini → `HH.mm`; kemarin → `Kemarin`; ≤ 7 hari → nama hari (`Senin`); lebih lama → `dd/MM/yy`.

### FR-5 — Isolasi Data *(PDF wajib #5, aturan D — prioritas penilaian #2)*
- **AC-5.1** Akun A **tidak dapat** membaca conversation/message akun B–C melalui: UI, Route Handler/Server Action, **REST/PostgREST langsung**, maupun **Realtime subscription**.
- **AC-5.2** Akun A tidak dapat menulis pesan atas nama akun lain, tidak dapat menyisipkan pesan ke percakapan yang bukan miliknya, tidak dapat mengubah/menghapus pesan.
- **AC-5.3** Pengguna tanpa login (anon) tidak mendapat data apa pun.
- **AC-5.4** Bukti tertulis: skrip `verify-rls` + ringkasan hasil di README.

### FR-6 — Light & Dark Mode *(PDF wajib #6, aturan E)*
- **AC-6.1** Tombol toggle tersedia di header **semua layar termasuk login** (dan register).
- **AC-6.2** Semua elemen terbaca jelas di kedua mode (kontras teks ≥ WCAG AA 4.5:1; teks sekunder minimal 4.5:1 juga).
- **AC-6.3** Tidak ada *flash* tema salah saat load.
- **AC-6.4** (Bonus B-3) Pilihan tersimpan setelah tab ditutup.

### FR-7 — Brand *(PDF wajib #7)*
- **AC-7.1** Logo **hitam** di light mode, **putih** di dark mode (di semua layar).
- **AC-7.2** Font **Nunito** untuk seluruh teks (termasuk input, tombol, placeholder).
- **AC-7.3** Palet hanya `#000000` & `#FFFFFF` + abu netral turunan (lihat §9). Tidak ada warna aksen lain.

## 6. Bonus (semua dikerjakan, setelah FR-1…7 lulus)

| ID | Fitur | Acceptance Criteria ringkas | Urutan |
|---|---|---|---|
| B-3 | Tema tersimpan | Preferensi bertahan setelah browser ditutup, tanpa flash | 1 (murah) |
| B-1 | Realtime | Pesan masuk muncul < 2 dtk tanpa refresh; daftar chat ikut terbarui; tidak ada duplikat; reconnect otomatis | 2 |
| B-4a | Belum dibaca | Badge jumlah di daftar chat; hilang saat percakapan dibuka; akurat lintas refresh | 3 |
| B-4b | Cari chat | Kolom "Cari chat" memfilter daftar berdasarkan nama/cuplikan | 3 |
| B-2 | Registrasi mandiri | `/register`: nama, email, password → akun + profil terbentuk → langsung masuk | 4 |
| B-4c | Status online | Indikator online/offline berbasis presence (bukan tulis DB) | 5 |
| B-5 | Ponsel | Layout satu panel di < 768 px (daftar ↔ percakapan), input tidak tertutup keyboard, target sentuh ≥ 44 px | dirancang sejak awal, dipoles akhir |

## 7. Requirements Non-Fungsional

### 7.1 Keamanan *(prioritas tinggi)*
- **NFR-S1** Row Level Security aktif di **semua** tabel `public`; kebijakan berbasis `auth.uid()`.
- **NFR-S2** Pesan bersifat *append-only* dari sisi klien (tidak ada policy UPDATE/DELETE). Kolom `sender_id`, `created_at`, `read_at` tidak bisa diisi klien.
- **NFR-S3** Secret (`SUPABASE_SERVICE_ROLE_KEY`, password DB, `.env*`) **tidak** ada di repo, riwayat git, maupun bundle browser. Runtime aplikasi hanya memakai URL + anon/publishable key + JWT pengguna.
- **NFR-S4** Validasi input di server (zod) untuk semua mutasi; batas panjang pesan; sanitasi pencarian (`%`, `_`).
- **NFR-S5** Perlindungan brute-force login (rate limit bawaan Supabase Auth) dan rate limit kirim pesan di DB.
- **NFR-S6** Security headers (nosniff, frame-ancestors/X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP minimum).
- **NFR-S7** Halaman terautentikasi tidak di-cache (`Cache-Control: no-store`) agar tidak bocor lewat cache/back button.
- **NFR-S8** Pesan error generik ke pengguna; detail hanya di log server tanpa PII/isi pesan.
- **NFR-S9** Jangan hanya mengandalkan middleware/proxy untuk proteksi halaman — verifikasi sesi juga di server layout dan tiap mutasi (defense in depth).

### 7.2 Performa
- **NFR-P1** Data awal (daftar chat, riwayat) di-render di server (tanpa waterfall fetch di klien).
- **NFR-P2** Query berindeks; tidak ada N+1; daftar chat = 1 query/RPC.
- **NFR-P3** UI kirim pesan **optimistic** (terasa instan); dedupe dengan ID dari klien.
- **NFR-P4** Satu channel Realtime per sesi (bukan per percakapan).
- **NFR-P5** Target Lighthouse (mobile, produksi) untuk `/login` dan `/chat`: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95. LCP < 2,5 dtk.
- **NFR-P6** Region database & fungsi serverless berdekatan (Singapura) untuk latensi pengguna Indonesia.
- **NFR-P7** Bundle JS minimal: mayoritas Server Components, tanpa library UI/utility berat.

### 7.3 Keandalan & Operasional
- **NFR-R1** URL publik tetap aktif **≥ 7 hari setelah pengumpulan**. Risiko: project Supabase free **auto-pause setelah 1 minggu tanpa aktivitas** → wajib ada keep-alive terjadwal (lihat ARCHITECTURE §10).
- **NFR-R2** Realtime putus → reconnect otomatis + refetch data saat kembali online/fokus.

### 7.4 Aksesibilitas
Label form, `focus-visible` jelas, dialog dengan focus trap & `Esc`, `aria-live="polite"` untuk pesan masuk, navigasi keyboard penuh, hormati `prefers-reduced-motion`.

## 8. Layar & Alur

```
[1 Login] --masuk--> [2 Daftar chat] --+ Chat baru--> [3 Dialog Chat baru] --Mulai chat--> [4 Percakapan]
     ^                     ^                                                                   |
     |                     +------------------------- kembali ke daftar ------------------------+
 (semua rute /chat* tanpa sesi diarahkan ke sini)
```

| Layar | Rute | Isi utama | State wajib |
|---|---|---|---|
| 1 Login | `/login` (+ `/register` bonus) | Logo, judul "Masuk", email, password, tombol, toggle tema | loading, error generik |
| 2 Daftar chat | `/chat` | Sidebar (cari, + Chat baru, daftar), panel kanan empty state | loading skeleton, empty |
| 3 Chat baru | dialog di atas `/chat` | Cari nama/email, daftar radio, Mulai chat, Tutup, catatan hanya pengguna terdaftar | loading, hasil kosong, error |
| 4 Percakapan | `/chat/[conversationId]` | Header lawan bicara (nama+email), pesan dikelompokkan per hari, composer | loading, kosong ("Belum ada pesan"), gagal kirim, tidak ditemukan (bukan milik/tidak ada → `404` generik) |

Catatan: PDF menyatakan tata letak **bebas** ("acuan alur & aturan, bukan acuan desain"); ilustrasi hal. 4 hanya arah. Kelima aturan A–E di PDF yang **harus benar-benar berjalan**.

Responsif (< 768 px): `/chat` menampilkan daftar; `/chat/[id]` menampilkan percakapan dengan tombol kembali. ≥ 768 px: dua panel.

## 9. Brand & Design Tokens

- **Logo:** dua versi (hitam & putih) dari folder *File Asset*, disimpan di `public/brand/`. Hitam → light, putih → dark.
- **Font:** Nunito (via `next/font`, self-hosted saat build) untuk seluruh teks; `font-family: inherit` pada input/tombol.
- **Warna:** hitam `#000000`, putih `#FFFFFF`; abu netral turunan (usulan, boleh disetel):

| Token | Light | Dark | Dipakai untuk |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#000000` | Latar utama |
| `--panel` | `#F5F5F5` | `#111111` | Sidebar/panel |
| `--surface` | `#EFEFEF` | `#1E1E1E` | Bubble masuk, item aktif |
| `--border` | `#E5E5E5` | `#2A2A2A` | Garis |
| `--fg` | `#000000` | `#FFFFFF` | Teks utama |
| `--fg-muted` | `#6B6B6B` | `#A3A3A3` | Teks sekunder (kontras ≥ 4.5:1) |
| `--accent-bg` | `#000000` | `#FFFFFF` | Tombol utama, bubble keluar |
| `--accent-fg` | `#FFFFFF` | `#000000` | Teks di atas accent |

- **Status tanpa warna aksen:** error = kotak berborder tebal + ikon + teks tebal (bukan merah); online = titik solid berring vs titik kosong (outline) untuk offline; badge unread = pil hitam/putih terbalik.
- Radius, spasi, dan bayangan mengikuti ilustrasi (sudut membulat, bubble pil, tombol penuh-hitam).

## 10. Deliverables (dari PDF)

| # | Item | Catatan |
|---|---|---|
| 1 | URL aplikasi publik (Vercel) | Aktif ≥ 7 hari setelah dikumpulkan |
| 2 | ≥ 2 akun sampel (email + password) | Dikirim **lewat pesan ke rekruter, bukan di README publik**; kredensial kuat |
| 3 | Link repo GitHub pribadi + collaborator `tec.akselera@gmail.com` | Tambahkan collaborator **di awal** agar tidak terlewat |
| 4 | README singkat | Stack & infrastruktur + alasan; cara jalan lokal; struktur tabel; AI tools; yang belum selesai |
| 5 | Konfirmasi selesai | Kirim ke nomor rekruter: `DONE TUGAS_VIBES PROGRAMMER` (sebelum 3 × 24 jam) |

## 11. Keputusan & Asumsi

| ID | Keputusan | Alasan singkat |
|---|---|---|
| D-1 | Next.js (App Router) + TypeScript + Tailwind | Wajib Next.js; Tailwind mempercepat tema light/dark berbasis token |
| D-2 | Supabase (Postgres + Auth + RLS + Realtime) | RLS memenuhi aturan D di level data; realtime bawaan; gratis |
| D-3 | Hosting Vercel (region `sin1`) | Integrasi Next.js terbaik, paket Hobby gratis |
| D-4 | Percakapan 1-on-1 disimpan sebagai pasangan `(user_a < user_b)` unik | Cegah duplikat, RLS sederhana & cepat |
| D-5 | Semua pengguna terautentikasi boleh melihat `nama + email` pengguna lain | Diperlukan fitur "Chat baru"; aplikasi internal. Hanya kolom non-sensitif |
| D-6 | Konfirmasi email **dimatikan** untuk demo | SMTP bawaan Supabase sangat terbatas; dicatat sebagai trade-off di README |
| D-7 | Zona waktu tampilan tetap Asia/Jakarta | Hindari mismatch hydration SSR vs klien |
| D-8 | Akses data lewat Server Components/Actions + klien browser hanya untuk Realtime | Validasi terpusat, tetap dilindungi RLS |
| D-9 | Keep-alive terjadwal ke database | Mencegah auto-pause Supabase free dalam masa 7 hari |

## 12. Risiko Utama

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Project Supabase ter-pause | App mati saat dinilai | Cron harian + cek manual hari ke-3 & ke-6 |
| Secret bocor ke repo/browser | Nilai keamanan turun drastis | `.gitignore`, `.env.example`, service key hanya di skrip lokal, cek riwayat git sebelum push |
| RLS salah (kebocoran data) | Gagal kriteria #2 | Skrip `verify-rls` dijalankan tiap perubahan skema |
| Waktu mepet (3 hari) | Wajib belum selesai | Ikuti urutan prioritas; bonus hanya setelah gate wajib lulus |
| Kode AI tidak dipahami | Gagal interview | Catatan "Interview Prep" di PROGRESS; kode sederhana & terstruktur |
| Slot free Supabase (2 project aktif) penuh | Tidak bisa buat project | Cek dashboard di awal; jeda/hapus project lama |

## 13. Definition of Done (proyek)

1. Semua AC FR-1…FR-7 lulus (dicentang di PROGRESS.md).
2. `verify-rls` hijau; uji manual dua akun + akun ketiga lulus.
3. Tidak ada secret di repo (cek `git log -p` / `gitleaks`) atau di bundle browser.
4. Deploy produksi berjalan; keep-alive aktif; akun sampel diuji di produksi.
5. Light & dark diperiksa di semua layar; brand sesuai.
6. README lengkap 5 bagian wajib; collaborator ditambahkan.
7. Bonus yang selesai/tidak selesai tercatat jujur di README.

## 14. Traceability (Aturan PDF → Requirement → Verifikasi)

| Aturan PDF | Requirement | Cara verifikasi |
|---|---|---|
| A — halaman chat tak bisa dibuka tanpa login | FR-1, NFR-S9 | Buka `/chat` & `/chat/:id` di jendela privat; `curl -I` mengembalikan redirect |
| B — hanya pengguna terdaftar | FR-2 | Panggil RPC dengan UUID acak → error FK/validasi |
| C — pesan persisten | FR-3 | Kirim → refresh → logout/login → tetap ada |
| D — hanya percakapan sendiri (termasuk API/DB) | FR-4, FR-5 | `verify-rls` + `curl` REST dengan token akun lain |
| E — light/dark di semua layar | FR-6, FR-7 | Toggle di login, daftar, percakapan, dialog; cek kontras |
