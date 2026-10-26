> Up: [docs-standard/README.md](../docs-standard/README.md)

# MAIA CS Frontend

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![npm](https://img.shields.io/badge/npm-11-CB3837?logo=npm&logoColor=white)
![Tabler Icons](https://img.shields.io/badge/Tabler_Icons-3-206BC4?logo=tabler&logoColor=white)
![Styling](https://img.shields.io/badge/Styling-CSS_Bersama-green)
![State Management](https://img.shields.io/badge/State_Management-TanStack_Query-green)
![Testing](https://img.shields.io/badge/Testing-Vitest_dan_Playwright-green)
![Status](https://img.shields.io/badge/Status-Milestone_7-yellow)
![License](https://img.shields.io/badge/License-Internal-lightgrey)

Dasbor admin untuk chatbot customer service MAIA CS (web dan WhatsApp), aplikasi internal Maharum Group yang dilayani sebagai bundel statis dari nginx di Cloud Run. **Admin mengatur perilaku bot, model, limit, dan channel dari dashboard, bukan dari kode**, dan kedelapan halamannya sudah dibangun (milestone 7): Ringkasan, Knowledge, Percakapan, Pengaturan Bot, Model, Limit, Channel, dan Playground. Halaman diuji dengan API di-mock; belum pernah dijalankan terhadap backend sungguhan di browser.

Widget chat untuk website pelanggan direncanakan sebagai milestone terpisah, dibangun dengan Preact di dalam Shadow DOM sebagai entry Vite kedua di repositori ini. Widget belum dibangun dan tidak ada kodenya di sini. Maksud produk ada di `PRD.md` repositori backend, dan rencana teknisnya di `PLAN.md` di folder induk.

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Project Structure](#4-project-structure)
5. [Configuration](#5-configuration)
6. [Routing, Pages, and Components](#6-routing-pages-and-components)
7. [State and Data Management](#7-state-and-data-management)
8. [Authentication, Styling, and Accessibility](#8-authentication-styling-and-accessibility)
9. [Testing, Errors, and Performance](#9-testing-errors-and-performance)
10. [Development and Deployment](#10-development-and-deployment)
11. [Deviations From the Standards](#deviations-from-the-standards)

## 1. Project Overview

MAIA CS Frontend adalah antarmuka admin untuk backend `maia-cs-backend`. Pengguna utamanya adalah admin customer service Maharum Group, yaitu pegawai yang tergabung di grup admin pada identitas SSO (`is_admin` dari `GET api/v1/auth/me`). Dari dashboard mereka mengelola dokumen knowledge, membaca percakapan, mengatur bot, model, limit, dan channel, serta menguji jawaban bot di Playground. Setiap perubahan pengaturan disimpan sebagai versi baru oleh backend.

Delapan bagian: Ringkasan, Knowledge, Percakapan (daftar dan rincian), Pengaturan Bot, Model, Limit, Channel, dan Playground. Kerangka di sekelilingnya: guard sesi, login mode stopgap, pengalihan ke SSO, sidebar, drawer mobile, klien API, PWA, dan pipeline deploy.

Aplikasi ini tidak menyimpan secret apa pun dan tidak menyimpan token di browser. Sesi adalah cookie HttpOnly yang diset backend.

## 2. Technology Stack

| Category         | Technology                                                                 | Version                        |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------ |
| Runtime          | Node (build dan test), nginx (penyaji)                                     | 24.x lokal, 20 di Docker, nginx 1.27 |
| Framework        | React dengan react-router-dom                                              | 19.3 dan 7.18                  |
| Language         | TypeScript, mode strict                                                    | 5.9                            |
| Package Manager  | npm, lockfile `package-lock.json` di-commit                                | 11                             |
| Build Tool       | Vite dengan `vite-plugin-pwa`                                              | 8.3 dan 2.0                    |
| UI Library       | `@tabler/icons-react` untuk ikon, komponen ditulis sendiri                 | 3.49                           |
| Styling          | CSS bersama di `src/index.css`, font dihosting sendiri lewat `@fontsource` | Tidak berlaku                  |
| State Management | `@tanstack/react-query` untuk server state, state lokal React              | 5.104                          |
| Data Fetching    | `axios`, `zod` untuk memvalidasi respons, `react-hook-form` untuk form     | 1.20, 4.6, 7.90                |
| Testing          | Vitest dengan Testing Library, `@playwright/test`                          | 5.0, 16.3, 1.64                |
| Deployment       | Cloud Run, `asia-southeast1`, image `nginx:1.27-alpine`                    | Tidak berlaku                  |

Alat pendukung: ESLint 10 dengan `typescript-eslint` 8, dan `openapi-typescript` 7 untuk tipe klien dari OpenAPI backend.

TypeScript dipasang di 5.9 dan bukan versi 7 yang terbaru karena `typescript-eslint` 8 hanya mendukung TypeScript di bawah 6.1 dan `openapi-typescript` 7 meminta TypeScript 5. Naikkan bersama kedua alat itu.

Chart.js 4 (grafik Ringkasan, dimuat malas lewat `import()` dan hanya mendaftarkan komponen yang dipakai) dan `qrcode` (QR pairing Baileys, digambar sebagai SVG inline karena CSP `img-src 'self'` memblokir gambar `data:`) sudah dipasang. `@tanstack/react-table` tidak dipasang: tabel memakai `DataTable` sendiri karena sort, filter, dan paginasi dikerjakan server.

<code style="color: red">Tidak digunakan</code> untuk Tailwind CSS, state manager global (Redux, Zustand), dan head manager (`react-helmet`).

## 3. Frontend Architecture

### Architecture Type

Single page application berbasis komponen, dengan folder berlapis: konfigurasi, klien API, kerangka aplikasi, komponen bersama, dan halaman.

### Architecture Description

Aplikasi memuat konfigurasi build (`VITE_*`), memastikan konfigurasi itu valid, lalu memasang router. Semua rute selain `/masuk` berada di balik `RequireSession`, yang menanyakan `GET api/v1/auth/me` dan menahan rute di balik gate loading sampai jawabannya pasti. Klien API satu-satunya tempat origin backend dan awalan `api/v1` digabung. Setiap 401 dari permintaan biasa ditangani di satu tempat: sesi di cache dijatuhkan, lalu guard mengalihkan ke login (mode stopgap) atau ke halaman SSO bersama (mode sso).

### Main Layers

| Layer                | Responsibility                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/config.ts`      | Membaca dan memvalidasi `VITE_*`. Dipakai browser saat start dan `vite.config.ts` saat build            |
| `src/api/`           | Klien axios, penguraian error standar, `QueryClient`, dan fungsi endpoint auth                          |
| `src/app/`           | Router, guard sesi, shell (sidebar dan topbar), daftar bagian navigasi, dan pemberitahuan versi baru    |
| `src/components/`    | Komponen bersama: gate loading, keadaan kosong, skeleton, spinner tombol, `DataTable`, `Pager`, `SearchBox`, `ConfirmDialog`, `StatTile`, `ErrorNotice`, dan `Chart` |
| `src/hooks/`         | `useUrlParams` (filter, pencarian, dan halaman di query string) dan `useDebouncedValue`                 |
| `src/pages/`         | Satu folder per bagian, ditambah halaman login dan halaman tidak ditemukan                              |
| `src/lib/`           | Fungsi murni: validasi path tujuan setelah login, penyusun URL SSO, pemutus lingkaran pengalihan, format angka, tanggal, dan biaya, serta label enum |

### Application Flow

```text
Application Start > Validasi VITE_* > Router > RequireSession > GET auth/me > Shell > Page Render
```

### User Interaction Flow

```text
User Action > Event Handler > Validasi zod > Mutation atau Query > Cache TanStack Query > Interface Update
```

### Rendering Strategy

Client-side rendering. Hasil build adalah berkas statis yang disajikan nginx, dengan fallback ke `index.html` untuk setiap path. Halaman dimuat malas per rute (`React.lazy`), dan service worker men-cache app shell.

## 4. Project Structure

```text
README.md  CLAUDE.md  AGENTS.md
Dockerfile  nginx.conf  cloudbuild.yaml  .env.example  .dockerignore  .gitignore
package.json  package-lock.json  index.html
vite.config.ts  vitest.config.ts  playwright.config.ts  eslint.config.js  tsconfig.json
docker/   10-default-port.envsh
scripts/  gen-api.mjs
e2e/      auth-guard.spec.ts  dashboard.spec.ts  fixtures/settings.json
public/   maharum-circle.png  pwa-192x192.png  pwa-512x512.png  pwa-maskable-512x512.png  apple-touch-icon.png
src/
  main.tsx  index.css  config.ts  constants.ts
  api/         client.ts  http.ts  errors.ts  auth.ts
  app/         App.tsx  RequireSession.tsx  Shell.tsx  Sidebar.tsx  sections.ts  session.ts  UpdateNotice.tsx
  components/  Gate.tsx  EmptyState.tsx  Skeleton.tsx  Spinner.tsx  PlaceholderPage.tsx
  pages/       Login.tsx  loginErrors.ts  NotFound.tsx
               ringkasan/  knowledge/  percakapan/  pengaturan-bot/  model/  limit/  channel/  playground/
  lib/         returnUrl.ts  redirect.ts  ssoLoop.ts
  test/        setup.ts
```

Berkas `*.test.ts` dan `*.test.tsx` berdampingan dengan kodenya.

### Directory Explanation

| Directory           | Purpose                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `src/api/`          | Satu-satunya tempat yang tahu cara memanggil backend. Halaman tidak memakai axios langsung        |
| `src/app/`          | Kerangka aplikasi yang membungkus semua halaman                                                   |
| `src/pages/<nama>/` | Satu halaman per bagian. `index.tsx` mengekspor halaman secara default supaya bisa dimuat malas   |
| `public/`           | Logo `maharum-circle.png` (satu-satunya berkas logo) dan ikon PWA yang diturunkan darinya         |
| `docker/`           | Skrip yang di-source entrypoint nginx untuk memberi nilai bawaan `PORT`                           |
| `e2e/`              | Smoke test Playwright dengan API di-mock lewat `page.route`                                       |
| `scripts/`          | Skrip bantu, saat ini pembangkit tipe API                                                         |

Folder `src/widget/` dan `vite.widget.config.ts` dari `PLAN.md` belum ada karena widget bukan bagian milestone ini.

## 5. Configuration

### Configuration Files

| File                | Purpose                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `.env.example`      | Referensi variabel environment                                                                   |
| `vite.config.ts`    | Plugin React, plugin PWA (manifest dan service worker), alias `@`, dan validasi env saat build   |
| `vitest.config.ts`  | Konfigurasi test: jsdom, alias `@`, dan berkas setup                                             |
| `playwright.config.ts` | Konfigurasi test end-to-end dan server dev miliknya                                           |
| `eslint.config.js`  | Aturan lint, termasuk larangan `dangerouslySetInnerHTML`, `innerHTML`, dan `localStorage`        |
| `tsconfig.json`     | TypeScript strict, satu konfigurasi untuk `src`, `e2e`, dan berkas config                        |
| `nginx.conf`        | Template server nginx: fallback SPA, header keamanan, dan CSP                                    |
| `Dockerfile`        | Build dua tahap: `node:20-alpine` lalu `nginx:1.27-alpine` tanpa root                            |
| `cloudbuild.yaml`   | Pipeline Cloud Build: guard, build, push, deploy                                                 |

### Environment Variables

| Variable             | Required                 | Public | Description                                                                                                  | Example                  |
| -------------------- | ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `VITE_API_BASE_URL`  | Yes                      | Yes    | Origin backend saja: tanpa path dan tanpa slash di belakang. Klien menambahkan `api/v1` sendiri              | `http://localhost:8080`  |
| `VITE_AUTH_MODE`     | Yes                      | Yes    | `sso` atau `stopgap`, harus sama dengan `AUTH_MODE` backend                                                  | `stopgap`                |
| `VITE_SSO_LOGIN_URL` | Hanya pada `VITE_AUTH_MODE=sso` | Yes | Halaman login SSO bersama. Nilai sebenarnya dikonfirmasi ke pemilik Identity Provider                        | To be confirmed          |

Semua nilai `VITE_*` ditanam ke bundel saat build, sehingga terlihat oleh siapa pun yang membuka aplikasi. **Tidak ada secret yang boleh masuk ke sini.** Mengubah nilainya berarti build ulang, bukan deploy ulang. Satu-satunya variabel runtime adalah `PORT`, yang disuntikkan Cloud Run dan dibaca nginx lewat `envsubst`.

Nama aplikasi `MAIA CS` sengaja tidak ada di daftar ini. Nama itu konstanta di `src/constants.ts` dan tidak dibaca dari environment.

Gunakan `.env.example` sebagai satu-satunya referensi. Berkas `.env` yang asli tidak dibaca dan tidak di-commit.

### Feature Flags

<code style="color: red">Tidak digunakan</code>

## 6. Routing, Pages, and Components

### Routing Method

`react-router-dom` v7 dengan `BrowserRouter` dan `Routes`. Setiap halaman dimuat malas. URL adalah sumber state (`refresh.component.md`), dan catch-all adalah halaman tidak ditemukan yang sungguhan, bukan redirect.

### Main Routes

| Route             | Page or Layout            | Access                                         |
| ----------------- | ------------------------- | ---------------------------------------------- |
| `/masuk`          | `LoginPage`               | Publik. Hanya berguna pada mode stopgap        |
| `/`               | `Shell` > Ringkasan       | Sesi valid dan `is_admin`                      |
| `/knowledge`      | `Shell` > Knowledge       | Sesi valid dan `is_admin`                      |
| `/percakapan`     | `Shell` > Percakapan      | Sesi valid dan `is_admin`                      |
| `/pengaturan-bot` | `Shell` > Pengaturan Bot  | Sesi valid dan `is_admin`                      |
| `/model`          | `Shell` > Model           | Sesi valid dan `is_admin`                      |
| `/limit`          | `Shell` > Limit           | Sesi valid dan `is_admin`                      |
| `/channel`        | `Shell` > Channel         | Sesi valid dan `is_admin`                      |
| `/playground`     | `Shell` > Playground      | Sesi valid dan `is_admin`                      |
| `*`               | `Shell` > NotFound        | Sesi valid dan `is_admin`                      |

### Main Pages

| Page            | Route             | Purpose                                                                           | Layout  |
| --------------- | ----------------- | --------------------------------------------------------------------------------- | ------- |
| Masuk           | `/masuk`          | Form NIP dan kata sandi untuk mode stopgap. Pada mode sso langsung ke `/`         | Tidak ada, kartu di tengah |
| Ringkasan       | `/`               | Kartu angka (percakapan, pesan masuk, fallback, kepuasan, biaya), peringatan mendekati batas biaya, dan tiga grafik dengan tampilan tabel | `Shell` |
| Knowledge       | `/knowledge`      | Unggah banyak berkas, aktif atau nonaktif, proses ulang, hapus dengan konfirmasi, rincian isi dan bagian, polling saat diproses | `Shell` |
| Percakapan      | `/percakapan`, `/percakapan/:id` | Daftar dengan filter di URL, ekspor CSV atau JSON, transkrip dengan sitasi, dan buka nomor lengkap (diaudit) | `Shell` |
| Pengaturan Bot  | `/pengaturan-bot` | Persona, instruksi, topik terlarang, pesan, mode konteks, dan riwayat versi dengan pemulihan | `Shell` |
| Model           | `/model`          | Model utama dan cadangan, daftar yang diizinkan, parameter, dan tes model          | `Shell` |
| Limit           | `/limit`          | Batas per channel dan batas biaya harian                                           | `Shell` |
| Channel         | `/channel`        | Domain widget, pengaturan WhatsApp, status sambungan, tes Meta, QR dan kode pairing Baileys | `Shell` |
| Playground      | `/playground`     | Chat uji dengan pengaturan tersimpan atau draf, beserta dasar jawabannya           | `Shell` |
| Halaman Tidak Ditemukan | `*`       | Menjelaskan bahwa alamat tidak ada dan menawarkan kembali ke Ringkasan            | `Shell` |

Pengaturan Bot, Model, Limit, dan Channel mengedit satu potongan dari pengaturan bot lewat `useSettingsSlice`, yang menyimpan seluruh pengaturan sebagai versi baru dengan versi dasar. Bila orang lain sudah menyimpan lebih dulu (409), halaman meminta muat ulang dan draf dibuang. Form yang kotor memberi peringatan sebelum halaman ditutup.

### Main Layouts

| Layout           | Purpose                                                                                  | Used By                       |
| ---------------- | ---------------------------------------------------------------------------------------- | ----------------------------- |
| `RequireSession` | Guard: gate loading, pengalihan, tolak non-admin, lalu meneruskan identitas ke `Shell`   | Semua rute selain `/masuk`    |
| `Shell`          | Sidebar, topbar dengan remah roti, dan area isi. Di bawah 860px sidebar menjadi drawer   | Semua halaman bagian          |

### Main Components

| Component         | Category | Responsibility                                                                                     |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `Sidebar`         | Layout   | Merek, navigasi dua level dari `sections.ts`, dan footer akun dengan Keluar                        |
| `Gate`, `ErrorGate` | Shared | Penahan layar penuh saat sesi dicek, dan layar galat dengan satu aksi                              |
| `EmptyState`      | Shared   | Keadaan kosong bersama: ikon redup, pesan, dan aksi opsional                                       |
| `PageSkeleton`    | Shared   | Skeleton bentuk halaman (judul, deskripsi, kartu) selagi halaman dimuat malas                      |
| `ButtonSpinner`   | Shared   | Spinner di dalam tombol yang sedang memproses                                                      |
| `PlaceholderPage` | Shared   | Judul dan deskripsi satu bagian, ditambah keadaan kosong, untuk halaman yang belum dibangun        |
| `UpdateNotice`    | Feature  | Toast "Versi baru tersedia" dengan tombol Muat Ulang                                               |

### Important Component Details

#### `PlaceholderPage`

Purpose:

Menampilkan satu bagian dari `src/app/sections.ts` sebagai halaman sementara. Judul dan deskripsi diambil dari sumber yang sama dengan sidebar, jadi keduanya tidak bisa berbeda.

| Property     | Type     | Required | Description                                              |
| ------------ | -------- | -------- | -------------------------------------------------------- |
| `sectionKey` | `string` | Yes      | Kunci bagian di `sections.ts`, misalnya `pengaturan-bot` |

#### `EmptyState`

Purpose:

Keadaan kosong untuk daftar atau tabel yang bisa kosong, sesuai `uix.component.md`.

| Property  | Type        | Required | Description                         |
| --------- | ----------- | -------- | ----------------------------------- |
| `icon`    | `Icon`      | Yes      | Komponen ikon Tabler                |
| `message` | `string`    | Yes      | Kalimat pesan, sentence case        |
| `action`  | `ReactNode` | No       | Aksi opsional di bawah pesan        |

## 7. State and Data Management

### State Management Method

`@tanstack/react-query` untuk server state dan hook React biasa untuk state lokal. Tidak ada store global.

### State Categories

| State Category   | Storage Method                                                    | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Local UI State   | `useState` di komponen                                            | Drawer terbuka, kata sandi terlihat, grup sidebar yang dibuka pengguna  |
| Server State     | TanStack Query, kunci `['session']`                               | Identitas sesi dari `GET auth/me`                                       |
| Persistent State | Cookie HttpOnly dari backend, dan satu penanda `sessionStorage`   | Sesi pengguna. Penanda hanya untuk memutus lingkaran pengalihan SSO     |

### State Flow

```text
User Action > Handler > setState atau setQueryData > Component Render
```

### Data Fetching Method

`axios` lewat satu instans (`src/api/http.ts`) yang dibungkus TanStack Query. Instans itu mengirim cookie (`withCredentials`), memakai `baseURL` origin ditambah `/api/v1`, dan mengubah semua kegagalan menjadi `ApiError`. Respons `auth/me` divalidasi dengan `zod`. Tipe dari OpenAPI backend dibangkitkan dengan `npm run gen:api` (lihat bagian 10).

### Data Request Flow

```text
Component > Fungsi di src/api > axios (cookie) > Interceptor error > TanStack Query > State Update
```

### Loading, Empty, and Error States

| State   | Interface Behavior                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------------- |
| Loading | Gate layar penuh `Memeriksa sesi...` saat sesi dicek, spinner dan `Memproses...` di tombol, skeleton saat halaman dimuat   |
| Empty   | `EmptyState` bersama, dengan pesan sentence case                                                                           |
| Error   | Galat jaringan atau server pada cek sesi tampil di `ErrorGate` dengan Coba Lagi. Galat login tampil di slot `login-err`    |
| Success | Halaman dirender di dalam `Shell`                                                                                          |

### Browser Storage

| Data                       | Storage          | Purpose                                                                              | Expiration                                  |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| Cookie sesi                | Cookie HttpOnly  | Diset dan dibaca backend. JavaScript frontend tidak bisa membacanya                  | Diatur backend (stopgap: 8 jam)             |
| `maia-cs:sso-redirect-at`  | `sessionStorage` | Waktu pengalihan SSO terakhir, supaya sesi yang tak terbaca tidak memicu lingkaran   | Sampai tab ditutup, berlaku jendela 15 detik |

Tidak ada token, kata sandi, atau data pengguna di `localStorage` atau `sessionStorage`. ESLint melarang keduanya di seluruh `src`, dengan satu pengecualian bertanda untuk penanda waktu di atas.

Detail kontrak API ada di `API.md` backend.

## 8. Authentication, Styling, and Accessibility

### Authentication Method

Sesi berupa cookie HttpOnly yang diset backend. Frontend memilih perilaku dari `VITE_AUTH_MODE`.

| Mode      | Perilaku saat belum ada sesi                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `stopgap` | Mengalihkan ke `/masuk?next=<path asal>`, menampilkan form NIP dan kata sandi, lalu `POST api/v1/auth/login`                          |
| `sso`     | Tidak ada form lokal. Browser dialihkan ke `VITE_SSO_LOGIN_URL` dengan `next=<alamat lengkap halaman asal>` supaya SSO mengembalikan pengguna |

Mode `dev` backend (identitas tetap untuk lokal) tidak perlu mode sendiri di frontend: `auth/me` langsung berhasil dan guard meneruskan.

### Authentication Flow

```text
Buka Halaman > GET auth/me > 200 identitas > Shell
Buka Halaman > GET auth/me > 401 > stopgap: /masuk > POST auth/login > cookie diset backend > kembali ke halaman asal
Buka Halaman > GET auth/me > 401 > sso: halaman SSO bersama > kembali ke halaman asal
Sesi habis saat dipakai > 401 dari permintaan apa pun > sesi di cache dijatuhkan > guard mengalihkan
```

Rute tetap di balik gate selama `auth/me` belum selesai, sehingga pengguna yang sudah masuk tidak pernah melihat form login saat refresh. Path tujuan setelah login hanya diterima bila same-origin: `//host`, `https://host`, `javascript:`, backslash, dan karakter kontrol ditolak, lalu jatuh ke `/`. Pada mode sso, bila pengguna kembali dari SSO dalam 15 detik dan sesi tetap kosong (misalnya cookie tidak sampai karena domain), aplikasi berhenti mengalihkan dan menampilkan pesan dengan tombol Masuk Ulang, bukan berputar tanpa akhir.

### Authorization Model

Berbasis grup. Backend mengisi `groups` dari identitas dan menghitung `is_admin`. Frontend hanya memakainya untuk menentukan apa yang dirender.

### Roles

| Role      | Frontend Access                                                                      |
| --------- | ------------------------------------------------------------------------------------ |
| Admin     | Seluruh delapan bagian                                                               |
| Bukan admin | Layar "Akun Anda belum diberi akses ke MAIA CS" dengan tombol Keluar, tanpa shell  |

Frontend access control must not be treated as the only security control. Backend menegakkan `require_role("admin")` pada setiap route data.

### Styling Method

CSS biasa dalam satu berkas, `src/index.css`, dengan kelas semantik (`.btn`, `.card`, `.tablewrap`, `.nav`, dan seterusnya) dan token CSS di `:root`. Tidak ada Tailwind. Warna, radius, dan bayangan tidak pernah ditulis ulang di komponen.

### Design System

Design system Maharum di `docs-standard/component/`, dengan `uix.component.md` sebagai akar. **Stylesheet referensinya, `maia-legal-frontend/src/index.css`, tidak bisa diakses saat scaffold ini dibuat, jadi `src/index.css` dibangun ulang dari dokumen komponen.** Lihat Known Limitations dan deviasi 2.

### Theme Structure

| Item        | Source                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Colors      | Blok `:root` di `src/index.css`. Warna aksi utama adalah biru `--accent`, bukan indigo                    |
| Typography  | Inter untuk semua teks antarmuka, Montserrat hanya di blok merek sidebar dan kartu login. Berat 400 sampai 700, subset latin, dihosting sendiri lewat `@fontsource` di `src/main.tsx` |
| Spacing     | Skala 4px (4, 8, 12, 16, 24, 32, 40) sebagai nilai literal di `src/index.css`                            |
| Breakpoints | 900px untuk grid dan target sentuh, 860px untuk drawer sidebar (pengecualian dari `sidebar.component.md`) |

### Responsive Design

Satu breakpoint utama di 900px: padding dan target sentuh menyesuaikan, dan di bawah 860px sidebar menjadi drawer dengan backdrop sungguhan, dianimasikan dengan `transform`. Drawer menutup saat link diklik, backdrop diklik, rute berubah, atau Escape ditekan. Tabel nanti dibungkus `.tablewrap` yang menggulir horizontal.

### Accessibility Practices

* Semantic HTML: `nav`, `main`, `header`, `aside`, `form`, dan `button` sungguhan untuk judul grup sidebar
* Keyboard navigation: semua kontrol dapat dijangkau, grup sidebar memakai `aria-expanded`, Escape menutup drawer
* Focus management: fokus pindah ke drawer saat dibuka dan kembali ke tombol menu saat ditutup, indikator fokus terlihat di setiap kontrol
* Form labels: `id` dan `htmlFor` berpasangan di login, `role="alert"` pada galat
* Alternative text: logo `alt=""` karena nama aplikasi sudah ada sebagai teks
* Color contrast: token turunan yang aman untuk teks (`--accent`, `--ok`, `--bad`, dan seterusnya)
* Screen reader support: setiap loading memakai `role="status"` dengan teks, link aktif membawa `aria-current="page"`
* Reduced motion: spinner diperlambat dan shimmer skeleton dimatikan

### Accessibility Standard

Standar internal di `uix.component.md` (kontras 4.5:1 untuk teks normal, target sentuh 44px). Audit otomatis belum dijalankan.

<code style="color: yellow">Sebagian didukung</code>

## 9. Testing, Errors, and Performance

### Testing Strategy

| Test Type          | Purpose                                                                                                                                    | Tool                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Unit Test          | Penguraian error API, interceptor 401, validasi path tujuan setelah login, penyusun URL SSO, validasi config, pemutus lingkaran SSO, hook URL, dan format | Vitest                       |
| Component Test     | Guard sesi, halaman login, komponen bersama, dan kedelapan halaman (data tampil, filter masuk URL, aksi memanggil endpoint yang benar, konfirmasi aksi destruktif, keadaan kosong dan galat) dengan HTTP di-mock. 341 tes | Vitest dan Testing Library   |
| End-to-End Test    | Alur login dan guard, lalu Ringkasan, filter Percakapan yang bertahan setelah refresh dan buka nomor lengkap, simpan pengaturan Model, Playground, dan keempat halaman lain tanpa galat konsol. API di-mock lewat `page.route`. 10 tes | `@playwright/test`           |

<code style="color: red">Tidak digunakan</code> untuk Integration Test terhadap backend sungguhan dan Accessibility Test otomatis.

### Running Tests

```bash
npm run test
npm run lint
npm run typecheck
npx playwright install chromium-headless-shell
npm run test:e2e
```

Test unit dan komponen tidak membutuhkan berkas `.env`. Playwright menjalankan server dev sendiri di port 5199 dengan nilai `VITE_*` miliknya dan tidak butuh backend.

### Error Categories

| Category             | Description                       |
| -------------------- | --------------------------------- |
| Validation Error     | Invalid user input                |
| Authentication Error | Missing or expired authentication |
| Authorization Error  | Insufficient access               |
| Network Error        | Connection or request failure     |
| Not Found Error      | Page or resource does not exist   |
| Application Error    | Unexpected frontend failure       |

Backend mengirim error dalam bentuk `{ "error": { "code", "message", "detail" } }`. `parseApiError` mengubahnya menjadi `ApiError` dengan `status`, `code`, `message`, dan `detail`. Respons yang bukan bentuk itu, misalnya HTML hasil fallback SPA, menjadi kode `INVALID_RESPONSE`, dan kegagalan tanpa respons menjadi `NETWORK_ERROR` atau `TIMEOUT`, keduanya dengan status 0. Pengguna tidak pernah melihat status HTTP atau kode mentah: pesan datang dari `userMessage` atau dari tabel pesan login.

### Error Flow

```text
Error > parseApiError (ApiError) > 401: sesi dijatuhkan, guard mengalihkan > lainnya: pesan untuk pengguna dan tombol Coba Lagi
```

### Performance Strategy

* Code splitting: setiap halaman dimuat malas per rute
* Tree shaking: ikon Tabler diimpor per nama
* Font optimization: hanya subset latin dan hanya berat yang dipakai, dihosting sendiri tanpa permintaan ke pihak ketiga
* Caching: service worker men-precache app shell, aset ber-hash di-cache satu tahun oleh nginx, `index.html` dan `sw.js` tidak pernah di-cache
* Prefetching: tidak digunakan

### Performance Monitoring

| Metric or Area | Tool or Method |
| -------------- | -------------- |
| Semua          | To be confirmed |

Belum ada pengukuran performa, dan tidak ada angka yang diklaim di sini.

## 10. Development and Deployment

### Requirements

* Node 22.12 atau lebih baru (diverifikasi dengan Node 24.21). Vitest 5 dan jsdom 30 memintanya. Image Docker memakai `node:20-alpine` untuk build produksi, dan Vite 8 meminta Node 20.19 atau lebih baru.
* npm 11
* Backend `maia-cs-backend` yang berjalan di `http://localhost:8080` untuk melihat login sungguhan. Test tidak membutuhkannya.
* Browser modern. Daftar versi yang didukung: To be confirmed

### Installation

```bash
npm ci
```

### Environment Setup

1. Salin `.env.example` ke `.env`.
2. Isi nilainya. Untuk lokal, nilai bawaan contoh sudah cocok dengan backend lokal.
3. Jangan commit `.env`.

```bash
cp .env.example .env
```

**Langkah ini wajib sebelum `npm run build`.** Build produksi gagal bila `VITE_*` kosong atau salah bentuk, dengan pesan `Konfigurasi build tidak valid: VITE_API_BASE_URL kosong.` Ini disengaja: nilai kosong akan tertanam ke bundel dan menghasilkan aplikasi yang memanggil origin-nya sendiri, dan hanya build ulang yang memperbaikinya. Aturan yang sama dijalankan oleh browser saat start, oleh guard di `cloudbuild.yaml`, dan oleh `Dockerfile`.

### Start the Development Server

```bash
npm run dev
```

### Local URL

`http://localhost:5173`. Origin ini sama dengan `DASHBOARD_ORIGIN` bawaan di `.env.example` backend, yang dibutuhkan untuk CORS dengan cookie.

### Build

```bash
npm run build
```

Keluarannya di `dist/`, termasuk `sw.js` dan `manifest.webmanifest`. Pratinjau lokal dengan `npm run preview`.

Tipe klien dari OpenAPI backend dibangkitkan dari berkas lokal, bukan dari URL:

```bash
npm run gen:api -- ./openapi.json
```

Perintah itu menulis `src/api/schema.d.ts`. Berkas tersebut belum ada karena `openapi.json` backend belum diberikan.

### Deployment

| Item             | Description                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform         | Cloud Run `maia-cs-frontend`, `asia-southeast1`, 1 vCPU, 512Mi, `--max-instances=2`, `--concurrency=80`, port 8080                                   |
| Trigger          | Cloud Build lewat `cloudbuild.yaml`. Substitusi dari luar: `_TAG` dan `_API_BASE_URL`. Dua lagi punya nilai bawaan: `_AUTH_MODE` (`stopgap`) dan `_SSO_LOGIN_URL` |
| Build Output     | `dist/` di dalam image `nginx:1.27-alpine`, berjalan sebagai user `nginx`, mendengarkan `$PORT`                                                       |
| Verification     | Buka alamat service, pastikan `/masuk` tampil, lalu refresh di rute dalam seperti `/limit` dan pastikan tidak 404                                    |
| Rollback Process | Deploy ulang tag image sebelumnya dari Artifact Registry. Detailnya menunggu `deploy.cloud.md`                                                       |

Perintah build manual:

```bash
gcloud builds submit --config cloudbuild.yaml "--substitutions=_TAG=$TAG,_API_BASE_URL=$API_BASE_URL"
```

`_API_BASE_URL` adalah origin backend: `https://host`, tanpa path dan tanpa slash di belakang. Guard di `cloudbuild.yaml` menggagalkan build bila kosong atau memuat path.

`deploy.cloud.md` belum ditulis di repositori ini dan dikerjakan pada milestone deploy, setelah bootstrap layanan di Cloud Shell. Sampai saat itu runbook kanonik ada di `docs-standard/rules/deploy.cloud.md`.

CSP di `nginx.conf` membatasi `connect-src` ke `'self'` dan origin API. Origin itu diganti saat build dari `VITE_API_BASE_URL`, jadi CSP dan bundel tidak bisa berbeda.

### Supported Browsers and Devices

| Environment           | Minimum Version or Support |
| --------------------- | -------------------------- |
| Browser desktop       | To be confirmed            |
| Browser mobile        | To be confirmed            |
| Instalasi PWA         | To be confirmed            |

### Known Limitations

| Limitation                                                                                                                  | Impact                                                                                                         | Planned Resolution                                          |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Halaman belum pernah dijalankan terhadap backend sungguhan di browser                                                       | Tes memakai HTTP yang di-mock. Perbedaan bentuk respons akan tertangkap tipe dari OpenAPI, tetapi perilaku end-to-end belum teramati | Dicoba pemilik dengan backend lokal; lalu e2e terhadap backend |
| Input tanggal dan pilihan memakai `<input type="date">` dan `<select>` bawaan browser                                       | `uix.component.md` meminta komponen `DateField` dan `Select` bertema. Fungsi dan aksesibilitasnya terjaga, tampilannya mengikuti browser | Komponen bertema bila diminta                               |
| Ekspor percakapan yang gagal menampilkan pesan umum                                                                          | Galat dari server berupa blob tidak diurai                                                                     | Diurai bila terbukti sering terjadi                         |
| Tampilan visual (tata letak, tinggi grafik, responsif) belum diperiksa mata manusia                                         | Hanya diuji perilakunya, belum tampilannya di layar nyata                                                      | Dilihat pemilik saat mencoba                                |
| Widget chat belum ada                                                                                                       | Tidak ada entry kedua, tidak ada `vite.widget.config.ts`                                                       | Milestone 8, Preact di Shadow DOM                           |
| `src/index.css` dibangun ulang dari `docs-standard/component/*.md`, bukan disalin dari `maia-legal-frontend/src/index.css` | Nilai bisa berbeda tipis dari referensi. Di mana dokumen diam (ukuran judul halaman, padding `.tag`, ukuran `.iconbtn`, hover `.btn.out` dan `.btn.ghost`) nilainya dipilih di sini. CSS dropdown listbox, kalender, dan pager belum ada karena komponennya belum ada | Direkonsiliasi dengan stylesheet referensi begitu repositorinya bisa diakses |
| Dokumen komponen saling bertentangan di beberapa titik                                                                      | `uix.component.md` menyebut varian `.btn.danger` berlatar merah, `button.component.md` menyebut `.btn.bad` bergaris merah: dipakai `.btn.bad` karena dokumen tombol pemilik varian. Ring fokus kolom isian di dokumen login dan dropdown bertentangan dengan akar: dipakai akar (border saja). Teks di bawah 12px memakai `--ink2`, bukan `--ink3` yang disebut dokumen sidebar dan login, karena kontras dan aturan teks redup 12px lebih tinggi prioritasnya | Dikonfirmasi saat rekonsiliasi dengan stylesheet referensi |
| Image Docker, `cloudbuild.yaml`, dan pipeline belum dijalankan                                                              | Hanya `nginx.conf` yang diuji, dengan nginx 1.18 lokal (header, fallback SPA, 404 aset). Entrypoint `envsubst`, user non-root, dan peringatan engines saat `npm ci` di Node 20 belum terverifikasi | Diverifikasi pada milestone deploy                          |
| `deploy.cloud.md` belum ditulis                                                                                              | Runbook deploy repositori ini belum ada                                                                        | Milestone deploy                                            |
| Cookie sesi bergantung pada `SameSite=Lax`                                                                                   | Bila frontend dan backend berada di host `.run.app` yang berbeda, browser menganggapnya lintas site dan cookie tidak ikut permintaan, sehingga login tidak bekerja di cloud. Tidak ada token CSRF karena `Lax` cukup menurut `security.rules.md` | Topologi domain (subdomain `maharum.group`) dikonfirmasi saat deploy |
| Nilai SSO belum dikonfirmasi                                                                                                 | Nama parameter `next` dan URL login SSO mengikuti `login.component.md` dan template cloudbuild, belum diuji dengan SSO sungguhan | Dikonfirmasi ke pemilik Identity Provider                   |
| `GET auth/me` tidak mengembalikan nama                                                                                       | Avatar di footer sidebar memakai ikon, bukan inisial, dan footer menampilkan NIP saja                          | Mengikuti bila backend menambah nama                        |
| Notifikasi sesi habis (`?reason=expired`) belum ada                                                                          | Pengguna yang sesinya habis langsung melihat form login tanpa penjelasan                                       | Belum dijadwalkan                                           |
| React Compiler belum diaktifkan                                                                                              | Memoization manual masih diperlukan bila halaman nyata butuh                                                   | Dinilai saat halaman berat pertama dibangun                 |
| PWA belum diaudit dengan Lighthouse dan belum dicoba di perangkat                                                            | Installability, ikon maskable, dan offline belum terverifikasi. Offline hanya menyajikan app shell dari cache, dan API tidak pernah di-cache. Tidak ada halaman offline terpisah | Diaudit sebelum rilis pertama                               |
| Tidak ada audit aksesibilitas otomatis                                                                                       | Kepatuhan hanya terjaga lewat aturan komponen dan test peran, bukan hasil audit                                | Playwright dengan pemeriksa aksesibilitas bila diperlukan   |

## Deviations From the Standards

1. **`stacks.rules.md` dikesampingkan.** Aturan itu menetapkan tumpukan teknologi yang disetujui. Proyek ini memakai tumpukan dari `instructions.md` (React 19, Vite 8, TypeScript 5.9, react-router-dom 7, TanStack Query 5, axios, zod, Vitest, Playwright) atas keputusan pemilik proyek. Biayanya: tidak ada panduan versi dari standar, jadi setiap pilihan dicatat di bagian Technology Stack, termasuk TypeScript 5.9 yang tertahan oleh alat lint. Tidak berlaku untuk aplikasi lain.
2. **`src/index.css` dibangun ulang dari dokumen, bukan disalin.** `uix.component.md` mewajibkan stylesheet disalin dari `maia-legal-frontend/src/index.css`. Repositori itu tidak bisa diakses saat scaffold dibuat, jadi stylesheet ditulis dari `uix.component.md` dan dokumen pendampingnya. Biayanya: nilai bisa berbeda dari referensi dan harus direkonsiliasi (lihat Known Limitations). Tidak berlaku untuk aplikasi lain.
3. **Widget direncanakan dengan Preact, di repositori yang sama.** Standar design system `component/*` ditulis untuk aplikasi internal, dan standar repositori meminta satu deployable per repositori. Widget tampil di website pihak lain, sehingga dibangun dengan Preact dalam Shadow DOM sebagai entry Vite kedua (Keputusan 6 dan 7 di `instructions.md`). Belum ada kodenya. Biayanya: bagian widget yang tidak bisa mengikuti design system dicatat di sini saat dibangun. Tidak berlaku untuk aplikasi lain.
4. **Form login menyimpang dari `login.component.md` di tiga titik.** Blok SSO tidak dirender, karena form lokal hanya hidup pada mode stopgap dan backend dalam mode itu tidak menerima cookie SSO, jadi tombolnya akan mati. Teks petunjuk di bawah form menjadi "Pakai NIP dan kata sandi yang diberikan admin sistem.", karena akun stopgap bukan akun HR. Ring fokus kolom isian dihilangkan mengikuti `uix.component.md`. Biayanya: tampilan sedikit berbeda dari aplikasi lain, dan petunjuk harus dikembalikan ke teks standar saat login memakai HR. Tidak berlaku untuk aplikasi lain.
5. **Sidebar menyimpang dari `sidebar.component.md` di dua titik.** Avatar memakai ikon, bukan inisial, karena `auth/me` tidak mengembalikan nama. Tombol menu di topbar berukuran 44px, bukan 38px, supaya memenuhi target sentuh minimum `uix.component.md`. Biayanya: perbedaan visual kecil dari aplikasi lain.
6. **`cloudbuild.yaml` tidak memakai substitusi `_APP_NAME` dan `_SSO_ENABLED` dari template.** `title.header.component.md` melarang nama aplikasi dibaca dari environment, dan pemilik proyek meminta `VITE_AUTH_MODE` (`sso` atau `stopgap`) sebagai pengganti `VITE_SSO_ENABLED`. Substitusi yang dikirim trigger tetap `_TAG` dan `_API_BASE_URL`, ditambah `_AUTH_MODE` dan `_SSO_LOGIN_URL` yang punya nilai bawaan. Biayanya: template dan berkas ini tidak lagi sebaris. Tidak berlaku untuk aplikasi lain.
