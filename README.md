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

1. Install dependency:

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
- `docs`: PRD, arsitektur, progress, serta handoff pengembangan.

## AI Tools yang Digunakan

- GitHub Copilot di VS Code untuk eksplorasi codebase, implementasi, refactoring, dan review.
- Tooling lokal Node.js, TypeScript, ESLint, dan Next.js untuk validasi otomatis.

AI digunakan sebagai alat bantu; keputusan keamanan tetap diverifikasi terhadap RLS, Server Actions, middleware, dan hasil `typecheck`, `lint`, serta `build`.

## Yang Belum Selesai dan Keterbatasan

- Belum ada automated unit atau end-to-end test; verifikasi fitur masih membutuhkan pengujian manual dengan dua atau tiga akun.
- Belum ada script `verify-rls` otomatis seperti yang direncanakan di dokumen arsitektur.
- Konfirmasi email mengikuti konfigurasi Supabase. Aplikasi sudah menampilkan instruksi aktivasi setelah registrasi apabila konfirmasi email diaktifkan.
- Pengguna terautentikasi dapat melihat nama dan email pengguna lain untuk mendukung fitur Chat Baru.
- Presence hanya menunjukkan online/offline dan tidak menyimpan `last seen`.
- Integrasi WhatsApp, group chat, attachment, edit/hapus pesan, reset password, push notification, dan PWA berada di luar scope.
- CSP masih menggunakan `unsafe-inline` sesuai konfigurasi Next.js saat ini.
- Supabase free tier dapat berhenti sementara jika keep-alive production tidak dikonfigurasi.

Detail requirement dan keputusan teknis dapat dibaca di [docs/PRD.md](docs/PRD.md) dan [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
