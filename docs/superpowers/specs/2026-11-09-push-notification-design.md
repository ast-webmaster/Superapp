# Push notification: catatan desain (draft diskusi)

Status: **draft hasil diskusi, belum disetujui sebagai desain final, belum ada kode.**
Tanggal: 2026-11-09. Untuk lanjut di sesi baru: baca file ini, lalu minta Claude melanjutkan dari bagian "Langkah berikutnya".

## Tujuan

Setiap kali backend (Laravel, `Laragon/digitalapproval`) selesai mengirim email notifikasi ke seseorang, user yang sama juga menerima push notification di HP-nya lewat app Superapp. Hari ini notifikasi hanya lewat email.

Dampak sampingan: badge dan daftar Inbox di app ikut ter-refresh saat push masuk. Saat ini Inbox tidak polling; ia hanya refetch saat layar dibuka, saat tab difokuskan, saat app kembali ke foreground, dan saat koneksi kembali (`src/modules/Inbox/hooks/use-inbox.ts`, `src/providers/query-client.ts`).

## Non-goals

- iOS **pasti dikerjakan**, tapi urutannya setelah Android: langganan Apple Developer Program baru dibeli sekitar bulan depan (Desember 2026) karena soal dana. Desain dan kode harus platform-agnostik supaya iOS tinggal menambah kredensial, bukan menulis ulang.
- Tidak mengubah puluhan job email per modul di tahap awal.
- Tidak membangun pengaturan preferensi notifikasi per user di tahap awal.

## Keputusan arsitektur (usulan Claude, disetujui user sebagai arah)

```
Backend kirim email -> event MessageSent -> job push (queue) -> Expo Push API -> HP
App login -> daftarkan token ke backend      App logout -> hapus token
Push masuk -> invalidate query Inbox         Push diketuk -> buka halaman dokumen
```

1. **Pengiriman lewat Expo Push API**, bukan FCM/APNs langsung. Satu HTTP call untuk dua platform. Konsekuensi: bergantung pada layanan Expo, dan app harus development build (bukan Expo Go).
2. **Titik pemasangan backend: hybrid.** Listener pusat pada event `Illuminate\Mail\Events\MessageSent` dengan **whitelist kelas Mailable**, mulai dari `App\Mail\NotificationMail`. Isi push awalnya diambil dari subject email (generik). Modul yang butuh isi lebih kaya diupgrade belakangan dengan memanggil `PushNotifier` secara eksplisit; fondasi yang sama dipakai.
3. **Backend:** tabel `device_tokens` (user_id, token, platform, last_seen_at); endpoint daftar dan hapus token di bawah auth API yang ada; pengiriman lewat queue; token yang dijawab Expo `DeviceNotRegistered` dihapus otomatis.
4. **App:** `expo-notifications` untuk izin dan token; daftarkan token saat login, hapus saat sign-out (menyambung ke cleanup sign-out di `src/providers/query-client.ts`); saat push masuk invalidate `inboxKeys.all`; saat diketuk navigasi lewat Expo Router.

## Fakta kondisi saat ini (dicek 2026-11-09)

- App: Expo SDK `~58.0.23`. Belum ada `expo-notifications`, `expo-dev-client`, `eas.json`, EAS `projectId`, `bundleIdentifier`/`package` di `app.json`. `expo-device` sudah ada.
- Backend: email dikirim dari banyak job terpisah per modul (`app/Jobs/NotificationEmailJob.php`, `Modules/*/Jobs/*`), masing-masing memanggil `Mail::to(...)`. Tidak ada tabel device token atau integrasi push. Sudah ada model in-app `App\Models\Notification` dan `NotificationJob`, serta `tests/Feature/ApiNotificationTest.php`.

## Persiapan oleh user (Android dulu)

| # | Item | Link |
|---|------|------|
| 1 | Akun Expo, lalu `eas login` dan `eas init` (menghasilkan `projectId`) | https://expo.dev/signup |
| 2 | Project Firebase, daftarkan app Android, unduh `google-services.json`, buat service account key untuk FCM V1 | https://console.firebase.google.com |
| 3 | Upload kredensial FCM V1 ke EAS | https://docs.expo.dev/push-notifications/fcm-credentials/ |
| 4 | Tentukan **package name Android** final (sulit diganti setelah dipakai) | - |
| 5 | HP Android fisik untuk tes | - |
| 6 | Pastikan queue worker jalan di server backend dan server bisa keluar ke `exp.host` (HTTPS) | - |
| 7 | Pastikan alamat email penerima bisa dipetakan ke satu user (kolom email unik) | - |

Tertunda sampai sekitar Desember 2026 (iOS, pasti dikerjakan): Apple Developer Program, $99/tahun, https://developer.apple.com/programs/ . Butuh juga bundle identifier iOS final dan push key APNs lewat EAS.

Dokumentasi acuan: https://docs.expo.dev/push-notifications/overview/ . Docs berubah antar SDK; sebelum menulis kode, baca docs versi SDK 58 (aturan di `AGENTS.md`).

## Persiapan Android: selesai (2026-11-09)

Akun Expo + `projectId` (di `app.json`), kredensial FCM V1 diupload ke EAS, `google-services.json` di root dan `android.googleServicesFile` terpasang di `app.json`, package `com.gustierlsteam.superapp`. File service account Firebase ada di root tapi di-gitignore (`*-firebase-adminsdk-*.json`); sebaiknya dipindah ke luar folder project. Belum ada: `expo-notifications`, `expo-dev-client`, development build.

## Temuan backend (dicek 2026-11-09, Laravel 13.38)

- **Queue:** `QUEUE_CONNECTION=database`, `MAIL_MAILER=smtp`. Email dikirim di dalam job yang di-queue (65 pemanggilan `->send()` di dalam job, 6 `->queue()`), jadi event `MessageSent` jalan di queue worker, bukan di request web. Worker wajib hidup di server.
- **Dua keluarga Mailable:** `NotificationMail` generik dipakai ~70 job; selain itu ada ~58 Mailable khusus per modul (mis. `PriceApprovalMail`, `PurchaseRequestMail`, `ServiceMail`, `TicketingMail`). **PriceApproval, modul referensi di app, memakai Mailable khusus, bukan `NotificationMail`**, jadi whitelist `NotificationMail` saja tidak mencakupnya.
- **Pemetaan email ke user:** `users.email` unik, jadi satu alamat = satu user. Pertanyaan ini terjawab. Penerima bisa berupa array (`Mail::to($recipients)`), jadi push dikirim ke tiap penerima.
- **Risiko listener:** event `MessageSent` jalan di dalam job email. Kalau listener melempar exception, job email gagal dan dicoba ulang, yang bisa mengirim email ganda. Listener hanya boleh men-dispatch job push terpisah dan tidak boleh melempar.
- **Belum diverifikasi:** `MessageSent` membawa pesan Symfony dan data view, bukan instance Mailable. Jadi "whitelist kelas Mailable" mungkin tidak bisa dibaca langsung dari event. Kandidat solusi: beri penanda (header khusus) dari `NotificationMail::build()` (satu tempat untuk ~70 job) dan dari Mailable khusus yang dipilih. Harus dicek di kode sebelum desain final.
- Model in-app `App\Models\Notification`, `ApiNotificationController` (`GET /api/notifications`), dan auth `auth:sanctum` + `user.active` sudah ada; endpoint token device mengikuti pola ini.

## Keputusan user: ketuk push langsung buka detail dokumen (2026-11-09)

Konsekuensi: push harus membawa `module` (slug manifest, mis. `price-approval`) dan `doc_uuid`. App sudah punya rute detail `src/app/(app)/price-approval/[id].tsx`, dan `ModuleManifest.detailRoute` sudah ada. Isi push dari subject email saja (generik) **tidak cukup**.

**Temuan yang memengaruhi desain (belum diverifikasi penuh):** Inbox app dibaca dari tabel `notifications` (`App\Models\Notification`, dibuat lewat `NotificationJob`), satu baris per penerima dengan `email`, `module_name`, `doc_uuid`, `status`, `tier`. Itu persis data yang dibutuhkan untuk push dan deep link, dan sumbernya sama dengan Inbox. Kandidat desain alternatif: **picu push dari pembuatan baris `Notification`** (observer model `created`), bukan dari event `MessageSent`. Keuntungan: tidak perlu menandai puluhan Mailable, data deep link sudah ada, push dan badge Inbox selalu konsisten. Yang harus dicek: apakah baris `Notification` dibuat untuk setiap email yang ingin dipush, dan apakah dibuat bersamaan dengan email (urutannya). Catatan: `ApiNotificationController::MODULES` saat ini hanya `price-approval`, jadi baru modul itu yang punya layar di app.

## Keputusan: push dikirim setelah email terkirim, dipanggil eksplisit dari job (2026-11-09)

User menegaskan push harus **setelah email** terkirim. Dicek di backend: modul pertama (PriceApproval) mengirim email dari satu tempat, `Modules/PriceApproval/Jobs/PriceApprovalJob.php`, yang memanggil `Mail::to($this->data['email'])->send(new NotificationMail($data))` di baris terakhir `handle()`. Di titik itu sudah ada `$header->pa_uuid` (doc_uuid untuk deep link), `$header->status`, `$title`, `$description`, dan email penerima. Karena itu desain disederhanakan:

- **Panggilan eksplisit** `PushNotifier` (men-dispatch job push di queue) tepat setelah `Mail::send` di job email modul. Urutan "setelah email" terjamin: kalau `Mail::send` melempar exception, push tidak dikirim.
- **Tidak memakai** listener `MessageSent` dan **tidak memakai** observer `Notification`. Dua opsi itu dibuang: yang pertama tidak membawa data deep link dan butuh penanda di puluhan Mailable, yang kedua tidak menjamin urutan terhadap email.
- Payload push: `{ module: 'price-approval', doc_uuid, title, body }`. App mengarahkan ke `price-approval/[doc_uuid]`.
- Penerima = email di job -> `users.email` (unik) -> semua `device_tokens` user itu.
- Push tidak boleh membuat job email gagal: panggilan `PushNotifier` dibungkus agar tidak pernah melempar (kalau melempar, job email di-retry dan email bisa terkirim dobel).
- Modul lain ditambahkan satu per satu dengan menyisipkan satu panggilan yang sama di job email masing-masing (~70 job memakai `NotificationMail`). Modul baru juga perlu didaftarkan di `ApiNotificationController::MODULES` dan punya rute detail di app.
- Catatan: `PriceApprovalJob` mengirim email untuk semua status (AWAITING, REJECTED, FINISH, dll), jadi push ikut untuk semua status. Teks push bisa memakai `$title` dan `$description` yang sudah dibuat job.

## Pertanyaan terbuka

- Modul mana yang masuk push lebih dulu? Karena Mailable-nya terpecah, perlu daftar prioritas (usul: PriceApproval karena sudah ada di app).
- Isi push generik dari subject cukup untuk tahap awal, atau ada modul prioritas yang langsung butuh isi kaya (judul, nomor dokumen, deep link)?
- Rute tujuan saat push diketuk: halaman detail dokumen tiap modul, atau cukup tab Inbox?
- Cara menandai email yang boleh jadi push (header dari Mailable vs daftar kelas), setelah diverifikasi bisa tidaknya dibaca dari `MessageSent`.

## Langkah berikutnya

1. User menyelesaikan item persiapan 1 sampai 4.
2. Jawab pertanyaan terbuka (Claude bisa cek backend untuk dua yang pertama).
3. Claude menyelesaikan desain tertulis ini, lalu membuat rencana implementasi (skill `superpowers:writing-plans`).
