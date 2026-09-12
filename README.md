# App Keuangan PT - Enterprise B2B Financial ERP & SAK EMKM

> **Aplikasi Keuangan Komprehensif B2B Siap Jual (Multi-Client / Commercial Web App)** dengan arsitektur **MVC**, backend **Google Apps Script (GAS)**, database relasional **Google Sheets**, dan frontend modern **SPA (Tailwind CSS, Chart.js, SweetAlert2, Driver.js)** yang dioptimalkan untuk di-deploy ke **GitHub** dan **Vercel**.

---

## 🌟 Fitur Utama & Arsitektur 3-Tier

```
                    ┌───────────────────────────────────────────┐
                    │    FRONTEND SPA (Vercel / GitHub Pages)   │
                    │  Tailwind CSS • Chart.js • Driver.js Tour │
                    └─────────────────────┬─────────────────────┘
                                          │ (JSON / CORS API)
                    ┌─────────────────────▼─────────────────────┐
                    │   BACKEND MVC (Google Apps Script WebApp) │
                    │   Controllers • Accounting Engine • CRUD  │
                    └─────────────────────┬─────────────────────┘
                                          │ (Bulk Read/Write Batch)
                    ┌─────────────────────▼─────────────────────┐
                    │   DATABASE RELASIONAL (Google Sheets)     │
                    │   9 Normalized Sheets • SAK EMKM Standard │
                    └───────────────────────────────────────────┘
```

### 1. Tier 1: Pencatatan Dasar (Basic Transactions)
- **Buku Kas & Bank**: Mutasi Kas Masuk, Kas Keluar, dan Transfer Antar Rekening (Mandiri, BCA, Kas Kantor) dilengkapi link lampiran bukti transfer.
- **Faktur Penjualan (Invoices / AR)**: Multi-item line builder, perhitungan PPN 11% otomatis, cetak invoice formal dan struk pembayaran printable, serta modul pelunasan instan.
- **Tagihan Beban (Expenses / AP)**: Pencatatan beban operasional dan non-operasional dengan due date tracking.

### 2. Tier 2: Kontrol & Operasional (Operations & Control)
- **Early-Warning Due Date System**: Notifikasi visual untuk tagihan jatuh tempo **H-3** dan status **Overdue**.
- **Stok & Inventori**: Penyesuaian stok otomatis saat faktur diterbitkan, warning minimum stock restock, dan valuasi persediaan.
- **Engine Payroll & Slip Gaji**: Perhitungan gaji pokok, tunjangan, potongan PPh/BPJS, Take Home Pay, cetak slip gaji karyawan, dan auto-journalize ke pos beban gaji.
- **Tool Rekonsiliasi Bank**: Pencocokan mutasi kas sistem vs rekening koran bank eksternal.

### 3. Tier 3: Laporan Finansial & Superadmin CMS
- **Laporan Real-Time SAK EMKM**:
  - Laporan Laba Rugi (Revenue, HPP, Gross Profit, Operating Expenses, Net Profit).
  - Laporan Neraca Seimbang (Aktiva Lancar/Tetap = Kewajiban + Ekuitas & Laba Berjalan).
  - Laporan Arus Kas (Aktivitas Operasi, Investasi, Pendanaan).
  - Indikator & Rasio Finansial (Current Ratio, Quick Ratio, Debt to Equity Ratio, Net Margin).
- **Audit Trail Jurnal Umum & Buku Besar**: Validasi mutlak keseimbangan debit/kredit (*Double-Entry Invariant*).
- **CMS White-Label & Multi-Tenant**: Pengaturan nama perusahaan, logo, mata uang, kunci lisensi komersial, kuota transaksi, serta manajemen hak akses pengguna (*Superadmin, Finance, Auditor*).
- **Onboarding Tour & Knowledge Base**: Panduan interaktif Driver.js langkah 1-2-3 untuk pengguna awam dan dokumen SOP Akuntansi.

---

## 📁 Struktur File Proyek

```text
App Keuangan PT/
├── backend/
│   ├── Code.gs                   # Main API Gateway, doGet, doPost, CORS & Router
│   ├── Config.gs                 # Konfigurasi sistem, nama sheet, konstanta & roles
│   ├── Setup.gs                  # initDatabase() - Auto-create 9 sheets & Standar COA SAK EMKM
│   ├── Models/
│   │   └── SheetModel.gs         # Abstraksi CRUD berkecepatan tinggi (getValues bulk)
│   ├── Services/
│   │   └── AccountingService.gs  # Engine Jurnal Berpasangan & Generator Laporan Finansial
│   └── Controllers/
│       ├── AuthController.gs     # Autentikasi, session token & user access
│       ├── TransactionController.gs # CRUD Kas/Bank, Invoices, Expenses, Payroll, Inventory
│       ├── ReportController.gs   # Laba Rugi, Neraca, Arus Kas & Analisis Rasio
│       └── AdminCMSController.gs # Manajemen Lisensi & Tenant Profile
├── index.html                    # Single Page Application Dashboard Layout & Modals
├── app.js                        # Client Router, State Management, API Caller & Dual-Mode Mock
├── styles.css                    # Modern Glassmorphic Design Tokens & Media Print CSS
├── knowledge-base.html           # In-App & Standalone SOP / Accounting Knowledge Base
├── vercel.json                   # Zero-config deployment file untuk Vercel
└── README.md                     # Panduan Lengkap Instalasi & Deployment
```

---

## 🚀 Panduan Setup & Deploy 1-Klik

### LANGKAH 1: Inisialisasi Database Google Sheets & Backend (GAS)

1. Buat Google Spreadsheet baru di [Google Sheets](https://sheets.new).
2. Beri nama spreadsheet Anda, misalnya: `Database ERP Keuangan PT`.
3. Buka menu **Ekstensi (Extensions)** &rarr; pilih **Apps Script**.
4. Salin seluruh file dari folder `backend/` ke editor Apps Script:
   - Buat file script sesuai struktur: `Config.gs`, `SheetModel.gs`, `AccountingService.gs`, `AuthController.gs`, `TransactionController.gs`, `ReportController.gs`, `AdminCMSController.gs`, `Setup.gs`, dan `Code.gs`.
5. Di editor Apps Script, pilih fungsi **`initDatabase`** pada dropdown fungsi &rarr; klik tombol **Run / Jalankan**.
   - Berikan izin (*Review Permissions* &rarr; *Allow*).
   - Skrip akan otomatis membuat **9 sheet lengkap** dengan header bertema Navy Blue, proteksi rumus, dan Chart of Accounts (COA) standar SAK EMKM Indonesia beserta data awal demo.
6. Klik tombol **Deploy** (di pojok kanan atas) &rarr; **New Deployment**:
   - Pilih jenis: **Web App**.
   - Description: `App Keuangan Production v2.4`.
   - Execute as: **Me (email Anda)**.
   - Who has access: **Anyone** (*Siapa saja*).
7. Klik **Deploy** dan salin **Web App URL** yang berakhiran `/exec` (Contoh: `https://script.google.com/macros/s/AKfycbx.../exec`).

---

### LANGKAH 2: Deploy Frontend ke GitHub & Vercel

1. **Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: release App Keuangan PT Enterprise B2B"
   git branch -M main
   git remote add origin https://github.com/USERNAME/app-keuangan-pt.git
   git push -u origin main
   ```
2. **Deploy ke Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com).
   - Klik **Add New...** &rarr; **Project** &rarr; Import repository GitHub Anda.
   - Vercel akan otomatis mendeteksi konfigurasi `vercel.json`. Klik **Deploy**.
   - Website SPA Anda langsung online dalam hitungan detik!

---

### LANGKAH 3: Menghubungkan Frontend ke Google Apps Script

1. Buka website Vercel Anda yang telah tayang.
2. Klik tombol **"Hubungkan Google Apps Script"** pada navigasi atas (topbar).
3. Tempelkan URL Web App GAS Anda (`https://script.google.com/macros/s/.../exec`).
4. Ubah mode ke **Live Mode (Google Sheets GAS)** &rarr; klik **Simpan / Hubungkan**.
5. Sistem sekarang 100% tersambung secara live ke database Google Sheets Anda!

---

## 👥 Akun Default (Demo & Production Seed)

| Username | Password | Role | Akses Fitur |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **Superadmin** | Seluruh Modul, CMS Lisensi, Manajemen User & Perusahaan |
| `finance` | `finance123` | **Finance** | Kas & Bank, Invoices, Tagihan Beban, Payroll, Laporan |
| `auditor` | `auditor123` | **Auditor** | Read-Only Laporan Keuangan, Jurnal Umum, & Buku Besar |

---

## 📊 Skema Chart of Accounts (COA) Standar

| Kode Akun | Nama Akun | Kategori | Saldo Normal |
| :--- | :--- | :--- | :---: |
| `1-1110` | Kas Operasional Kantor | Asset | **Debit** |
| `1-1120` | Bank Mandiri Rekening Giro | Asset | **Debit** |
| `1-1130` | Bank BCA Rekening Operasional | Asset | **Debit** |
| `1-1200` | Piutang Usaha (AR) | Asset | **Debit** |
| `1-1300` | Persediaan Barang Dagang | Asset | **Debit** |
| `1-2100` | Peralatan & Mesin Kantor | Asset | **Debit** |
| `2-1100` | Utang Usaha (AP) | Liability | **Kredit** |
| `2-1300` | Utang Pajak (PPN / PPh) | Liability | **Kredit** |
| `3-1000` | Modal Disetor Pemilik | Equity | **Kredit** |
| `3-2000` | Saldo Laba Ditahan | Equity | **Kredit** |
| `4-1000` | Pendapatan Penjualan & Jasa | Revenue | **Kredit** |
| `5-1000` | Beban Pokok Penjualan (HPP) | Expense | **Debit** |
| `6-1100` | Beban Gaji & Upah Karyawan | Expense | **Debit** |
| `6-1200` | Beban Sewa Gedung Kantor | Expense | **Debit** |
| `6-1300` | Beban Listrik, Air & Internet | Expense | **Debit** |

---

## 🔒 Lisensi & Komersialisasi
Aplikasi ini dirancang siap jual (Multi-Tenant). Setiap instans tenant dapat diberikan kunci lisensi (*License Key*) unik dengan kuota transaksi yang dapat diatur oleh Superadmin.

Dibuat dengan standar industri oleh **Senior Full-Stack Architect & Principal Software Engineer**.
