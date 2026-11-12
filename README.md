# Si-MAKO — Sistem Manajemen Konveksi (tampilan)

Ini adalah **tampilan** aplikasi Si-MAKO: catat pesanan per ukuran, pembayaran & uang muka, tahap produksi, nota, stok bahan, keuangan, dan laporan bulanan untuk usaha konveksi.

Tampilan ini **tidak menyimpan data apa pun**. Semua data tersimpan di Google Sheet & Google Drive milik akun Google pemilik usaha, lewat "mesin" (Google Apps Script) yang dipasang terpisah. File mesin hanya diberikan kepada pembeli Si-MAKO.

## Pasang tampilan (untuk pembeli Si-MAKO)

Ikuti **Panduan Memasang Si-MAKO** yang kamu terima dari Kang Aab (Bagian 2). Langkah singkatnya:

1. Pasang mesin di Google Apps Script dan salin **URL web app** yang berakhiran `/exec`.
2. Klik tombol **Fork** di kanan atas halaman ini (butuh akun GitHub gratis).
3. Di Vercel: **Add New → Project** → pilih **`si-mako` milikmu** → **Import**.
4. Buka **Environment Variables**, isi Key `SIMAKO_API_URL` dengan URL `/exec` dari langkah 1, lalu **Deploy**.
5. Buka alamat aplikasi + `/?setup=1` → harus muncul **"Server siap"**.

**Memperbarui tampilan:** buka repositori `si-mako` milikmu di GitHub → **Sync fork** → **Update branch**. Vercel otomatis menerbitkan versi baru. Jangan mengubah file apa pun di fork-mu.

> **Catatan lisensi Vercel:** paket gratis Vercel (Hobby) hanya untuk pemakaian pribadi non-komersial. Aplikasi untuk usaha termasuk komersial, jadi gunakan paket Vercel Pro, atau pakai hosting cadangan yang dijelaskan di panduan (Lampiran B).

## Untuk pengembang

- Tanpa framework dan tanpa dependensi npm. Build: `node build.js` → folder `dist/` (menulis `config.js` dari environment variable `SIMAKO_API_URL`).
- Hosting tanpa build: isi `API_URL` langsung di `config.js`, lalu unggah seluruh isi folder ini.

Hak cipta © Kang Aab. Kode ini hanya untuk dipakai oleh pembeli Si-MAKO di usahanya sendiri; dilarang dijual ulang atau dibagikan.
