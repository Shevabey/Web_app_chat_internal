# Akselera Chat

Aplikasi chat internal 1-on-1 untuk tim Akselera.Tech. Pengguna dapat mendaftar, masuk, mencari pengguna lain, membuat percakapan, mengirim pesan teks, melihat status online, dan menerima pesan secara realtime.

Keamanan utama ditegakkan di database dengan Supabase Row Level Security (RLS). Pengguna hanya dapat membaca percakapan yang melibatkan akunnya sendiri.

## Stack dan Infrastruktur

| Teknologi             | Penggunaan dan alasan                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------- |
| Next.js 14 App Router | Server Components, Server Actions, middleware, dan routing terproteksi dalam satu framework. |
| React 18 + TypeScript | UI interaktif dengan type safety dan kontrak data yang jelas.                                |
| Tailwind CSS          | Styling konsisten berbasis design tokens light/dark dengan bundle kecil.                     |
| Supabase Auth         | Email/password authentication dan session berbasis cookie JWT.                               |
| Supabase PostgreSQL   | Database relasional yang cocok untuk profil, percakapan, dan pesan.                          |
| Supabase RLS          | Isolasi data di level database, termasuk akses REST dan Realtime.                            |
| Supabase Realtime     | Pesan baru, pembaruan daftar percakapan, dan presence online.                                |
| Zod                   | Validasi input server untuk auth, pesan, pencarian, dan conversation.                        |
| Vercel                | Hosting yang terintegrasi dengan Next.js dan cocok untuk deployment serverless.              |

Supabase dipilih karena Auth, PostgreSQL, RLS, dan Realtime tersedia dalam satu layanan. Vercel dipilih karena deployment Next.js sederhana dan mendukung route serverless. `lucide-react` digunakan untuk ikon yang konsisten dan ringan, sedangkan `next-themes` menyimpan preferensi tema tanpa flash tema saat load.

## Menjalankan Secara Lokal

Prasyarat: Node.js 18+ dan project Supabase.

1. clone reapository & Install dependency:

```bash
   git clone https://github.com/Shevabey/Web_app_chat_internal.git
```

```bash
   cd Web_app_chat_internal
```

```bash
npm install
```

2. Buat file `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```

   Jangan gunakan atau commit service-role key ke browser maupun repository.

3. Jalankan SQL pada [migration](supabase/migrations/20260928111049_create_chat_schema.sql) melalui Supabase SQL Editor.

4. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

5. Buka `http://localhost:3000`.

Pemeriksaan sebelum deployment:

```bash
npm run typecheck
npm run lint
npm run build
```

## Struktur Tabel

Skema lengkap berada di [supabase/migrations/20260928111049_create_chat_schema.sql](supabase/migrations/20260928111049_create_chat_schema.sql).

- `profiles`: profil publik internal yang terhubung 1:1 dengan `auth.users`; berisi `id`, `email`, `display_name`, dan `created_at`.
- `conversations`: percakapan 1-on-1 dengan `user_a`, `user_b`, preview pesan terakhir, waktu pesan terakhir, dan constraint pasangan unik.
- `messages`: pesan append-only dengan `conversation_id`, `sender_id`, `body`, `created_at`, dan `read_at`.

Database juga memiliki trigger untuk membuat profil otomatis, memperbarui preview percakapan, dan membatasi maksimal 20 pesan per 10 detik. RPC yang digunakan aplikasi adalah `list_my_conversations`, `start_conversation`, `mark_conversation_read`, dan `ping`.

## Struktur Source

- `src/app`: route, layout, Server Actions, dan API health route.
- `src/components/ui`: primitive reusable seperti `Button`, `Input`, `PasswordInput`, `Modal`, `Avatar`, `Badge`, dan `Skeleton`.
- `src/components/chat`: sidebar, thread, composer, dialog chat baru, provider realtime, dan message bubble.
- `src/lib/auth`: proteksi user dan validasi redirect internal.
- `src/lib/supabase`: client server, client browser, dan refresh session middleware.
- `src/lib/validation`: schema Zod untuk input aplikasi.
- `src/types`: type contract untuk profile, conversation, message, dan action result.
- `docs`: [PRD](docs/PRD.md) dan [Architecture](docs/ARCHITECTURE.md), sumber requirement produk dan keputusan teknis.

## Status PRD dan Architecture

Status berikut dinilai dari source dan konfigurasi saat ini. "Terimplementasi" berarti ada implementasinya di codebase, bukan klaim bahwa alur sudah lulus pengujian end-to-end.

### Fitur Wajib

| Requirement PRD                        | Status                             | Catatan                                                                                                                                                                                                                                                           |
| -------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1 Login/logout dan proteksi rute    | Terimplementasi                    | Middleware, `requireUser()`, Server Actions, pesan login generik, dan safe redirect tersedia.                                                                                                                                                                     |
| FR-2 Mulai chat baru                   | Sebagian                           | Search, exclude diri sendiri, validasi server/RPC, dan conversation idempotent tersedia. Memilih user langsung membuat chat; PRD meminta pilihan lalu tombol **Mulai chat**.                                                                                      |
| FR-3 Kirim/terima dan pagination pesan | Terimplementasi                    | Persisten, plain text, optimistic send, retry, pagination 50 pesan. Receipt: satu centang saat penerima offline, dua abu-abu saat online tetapi belum membaca, dua biru setelah `read_at` terkonfirmasi.                                                          |
| FR-4 Daftar chat                       | Terimplementasi                    | Nama, preview, waktu lokal Asia/Jakarta, sorting, search, dan empty state tersedia.                                                                                                                                                                               |
| FR-5 Isolasi data                      | Sebagian: kontrol ada, bukti belum | RLS, session checks, participant checks, dan tidak ada policy update/delete pesan. Script `verify-rls` dan hasil uji yang diminta PRD belum tersedia. Column-level grants untuk melarang klien mengisi `created_at`/`read_at` juga belum diterapkan di migration. |
| FR-6 Light/dark mode                   | Terimplementasi                    | `next-themes` tersedia di login, register, dan chat; preferensi tema disimpan.                                                                                                                                                                                    |
| FR-7 Brand                             | Terimplementasi di source          | Nunito, token warna, serta aset logo dark/light dari `public/logo` dipakai. Pemeriksaan visual semua layar belum dilakukan.                                                                                                                                       |

### Fitur Bonus

| Bonus PRD           | Status                    | Catatan                                                                                                                                             |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| B-1 Realtime        | Terimplementasi di source | Satu channel chat, event pesan/conversation, update read receipt, serta refresh saat reconnect/fokus. Perlu uji dua akun untuk membuktikan runtime. |
| B-2 Registrasi      | Terimplementasi           | Registrasi dan validasi password; setelah daftar kembali ke login dengan instruksi aktivasi. Email confirmation mengikuti konfigurasi Supabase.     |
| B-3 Tema tersimpan  | Terimplementasi           | Disediakan oleh `next-themes` dengan `localStorage`.                                                                                                |
| B-4a Unread badge   | Terimplementasi di source | Unread count dari RPC dan mark-as-read tersedia; perlu uji lintas akun.                                                                             |
| B-4b Cari chat      | Terimplementasi           | Filter lokal atas nama dan preview percakapan. Pencarian pengguna memakai debounce 250 ms.                                                          |
| B-4c Status online  | Sebagian                  | Presence online/offline tersedia; authorization channel privat dan uji isolasinya belum dikonfigurasi/dibuktikan.                                   |
| B-5 Tampilan mobile | Sebagian                  | Layout daftar/thread satu panel tersedia. Target composer 44 px, safe-area keyboard, dan uji viewport belum diverifikasi.                           |

### Penilaian Berdasarkan Prioritas

1. **Fitur wajib:** mayoritas tersedia; FR-2 belum memenuhi alur pilih pengguna lalu konfirmasi, dan perlu dites end-to-end.
2. **Keamanan akses data dan secret:** middleware, `requireUser()`, validasi server, anon key, dan RLS ada. Sebelum dinyatakan lulus, tambahkan/verifikasi column-level grants, konfigurasi akses Realtime presence, dan jalankan pengujian RLS langsung sebagai beberapa akun. `.env*` lokal diabaikan Git; hanya `.env.example` yang diizinkan masuk repository.
3. **Kerapian kode, README, dan infrastruktur:** struktur route/component terpisah, typecheck/lint/build tersedia, cron health dan region `sin1` dikonfigurasi. Belum ada automated unit/E2E test atau script `verify-rls`.
4. **Brand light/dark:** font Nunito, token tema, dan dua aset logo sudah dipasang. Kontras WCAG dan tampilan aktual kedua mode masih perlu pemeriksaan visual.
5. **Bonus:** realtime, tema tersimpan, unread, pencarian, registrasi, dan presence tersedia; tingkat kepastian runtime berbeda karena pengujian multi-user belum otomatis.

## AI Tools yang Digunakan

- GitHub Copilot di VS Code untuk eksplorasi codebase, implementasi, refactoring, dan review.
- Tooling lokal Node.js, TypeScript, ESLint, dan Next.js untuk validasi otomatis.

AI digunakan sebagai alat bantu; keputusan keamanan tetap diverifikasi terhadap RLS, Server Actions, middleware, dan hasil `typecheck`, `lint`, serta `build`.

## Yang Belum Selesai dan Keterbatasan

- Belum ada automated unit atau end-to-end test; verifikasi fitur masih membutuhkan pengujian manual dengan dua atau tiga akun.
- Presence hanya menunjukkan online/offline dan tidak menyimpan `last seen`.
- Integrasi WhatsApp, group chat, attachment, edit/hapus pesan, reset password, push notification, dan PWA berada di luar scope.
