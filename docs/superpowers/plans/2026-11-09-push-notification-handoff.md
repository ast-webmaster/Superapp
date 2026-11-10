# Push notification: handoff untuk sesi baru

Tanggal: 2026-11-09. Baca file ini dulu, lalu lanjutkan eksekusi plan.

## Status

| Task | Repo | Status |
|---|---|---|
| 1 Device tokens (tabel, model, endpoint, cleanup logout) | backend | **Selesai**, commit `a44d1c692`, review bersih |
| 2 `CheckPushReceiptsJob` + config `services.expo.access_token` | backend | Belum |
| 3 `SendPushNotificationJob` + `App\Services\PushNotifier` | backend | Belum |
| 4 Pasang di `PriceApprovalJob` (push setelah `Mail::send`) | backend | Belum |
| 5 App: install dependency, plugin, `src/core/notifications/*` | app | Belum |
| 6 App: routing tap, listener, invalidate Inbox, mount di root navigator | app | Belum |
| 7 Docs (`docs/data-management.md`, status spec) | app | Belum |
| 8 Tes manual di HP Android (development build) | user | Belum |

## Lokasi

- Plan: `docs/superpowers/plans/2026-11-09-push-notification.md`
- Spec: `docs/superpowers/specs/2026-11-09-push-notification-design.md` (statusnya masih "draft"; Task 7 mengubahnya)
- Ledger SDD (git-ignored): `.superpowers/sdd/2026-11-09-push-notification/progress.md`, berisi tabel pre-flight, rulings, brief `task-N-brief.md`, `task-1-report.md`
- App: `C:\Users\Web.Developer\Laragon\Superapp`, branch `feature/push-notification` (base master, commit prep `07407aa`)
- Backend: `C:\Users\Web.Developer\Laragon\digitalapproval`, branch `feature/push-notification` (base DEV `05f8b3a5a`, HEAD sekarang `a44d1c692`)

## Cara lanjut

Tempel prompt ini di sesi baru:

```
Lanjutkan eksekusi plan push notification pakai superpowers:subagent-driven-development.
Baca docs/superpowers/plans/2026-11-09-push-notification-handoff.md, lalu ledger di
.superpowers/sdd/2026-11-09-push-notification/progress.md. Task 1 sudah selesai; mulai dari Task 2
(BASE backend = a44d1c692). Task 8 gue kerjakan sendiri. Bahasa Indonesia santai.
```

Alur per task: dispatch implementer (sonnet), review package dari repo backend dengan OUTFILE di workspace,
task reviewer (sonnet), fix loop kalau ada Critical/Important. Setelah semua task: review satu branch
penuh dengan model paling capable, lalu `finishing-a-development-branch`.

## Rulings (sudah diputuskan)

- `DeviceToken::user(): BelongsTo` wajib ada (dibutuhkan Task 3). Sudah ada.
- Test kegagalan Task 4 pakai `Mail::shouldReceive('to')->andThrow(...)` tanpa `Mail::fake()`.
- Migrasi HANYA ke DB test `astrindo_superapp_test` lewat env override dan path satu file migrasi:
  `DB_DATABASE=astrindo_superapp_test php artisan migrate --path=<file>`. Jangan migrate DB dev/production,
  jangan pakai `migrate:fresh/refresh/db:wipe`. `.env.testing` tidak ada.
- `PushNotifier::notify()` tidak boleh melempar exception, supaya job email tidak di-retry dan email tidak dobel.
- Model: implementer dan task reviewer sonnet, review akhir fable.
- Trailer commit: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Catatan teknis

- Jalankan tes backend per path file, bukan `--filter`: ada fatal lama di `Modules/AiChat/Tests/Unit/ScopeResolverTest.php`. Sekitar 45 detik per file.
- Migrasi aset write-off `2026_11_09_100001` di backend belum dijalankan dan bukan bagian dari tugas ini.
- Minor yang ditunda dari review Task 1 (ada di ledger): race pendaftaran token yang sama bersamaan (500 di unique index), tes belum menegaskan `access_token_id` berubah saat token pindah user, tidak ada tes DELETE oleh user non-aktif dan logout yang tidak menyentuh baris user lain, delete token dan logout tanpa transaksi.
- Pakai `npx expo install` untuk dependency app. Baca docs Expo SDK 58 sebelum menulis kode Expo (`AGENTS.md`).

## Yang harus lo kerjakan sendiri

1. `php artisan migrate` di DB dev/production backend untuk tabel `device_tokens` (setelah semua task selesai dan di-merge).
2. Pastikan queue worker jalan di server dan server bisa keluar ke `exp.host` (HTTPS).
3. Bikin development build: `eas build --profile development --platform android`, lalu Task 8 di HP Android fisik. Expo Go tidak bisa menerima remote push di Android.
4. Pindahkan file `notification-superapp-firebase-adminsdk-fbsvc-2c8e95a519.json` dari root project ke luar folder project. Sudah di-gitignore, tapi berisi private key.
5. iOS ditunda sampai sekitar Desember 2026 (Apple Developer Program). Kode sudah platform-agnostik; iOS tinggal kredensial dan build.
