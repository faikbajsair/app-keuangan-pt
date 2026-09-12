/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Setup.gs - Database Initialization & Auto-Migrate Engine
 * ============================================================================
 */

function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet Schema Definitions
  const SCHEMAS = {
    Config_Tenant: [
      "Company_Name", "Company_Address", "Company_Logo_URL", "License_Key", 
      "License_Status", "Transaction_Quota", "Currency_Symbol", "Fiscal_Year", 
      "Tax_Rate", "Updated_At"
    ],
    COA: [
      "Account_Code", "Account_Name", "Category", "Sub_Category", 
      "Normal_Balance", "Opening_Balance", "Current_Balance", "Is_Active"
    ],
    Jurnal_Umum: [
      "Journal_ID", "Date", "Account_Code", "Account_Name", 
      "Description", "Debit", "Credit", "Ref_ID", "Module", "Created_By", "Created_At"
    ],
    Kas_Bank: [
      "Tx_ID", "Date", "COA_Source", "COA_Target", 
      "Type", "Amount", "Description", "Receipt_URL", "Created_By", "Created_At"
    ],
    Invoices_AR: [
      "Invoice_ID", "Date", "Due_Date", "Customer_Name", "Items_JSON", 
      "Subtotal", "Tax_Amount", "Grand_Total", "Amount_Paid", "Status", "Notes", "Created_At"
    ],
    Expenses_AP: [
      "Bill_ID", "Date", "Due_Date", "Vendor_Name", "Category_COA", 
      "Description", "Amount", "Status", "Receipt_URL", "Payment_Date", "Payment_COA", "Created_At"
    ],
    Inventory: [
      "SKU", "Item_Name", "Unit", "Cost_Price", 
      "Selling_Price", "Stock_Qty", "Min_Stock", "COA_Asset", "COA_COGS", "Updated_At"
    ],
    Payroll: [
      "Payroll_ID", "Period_Month_Year", "Employee_ID", "Employee_Name", 
      "Basic_Salary", "Allowances", "Deductions", "Net_Salary", "Payment_Date", 
      "Status", "COA_Expense", "COA_Kas"
    ],
    Users_Auth: [
      "User_ID", "Username", "Full_Name", "Password_Hash", 
      "Role", "Status", "Last_Login"
    ]
  };

  // 1. Create and format each sheet
  Object.keys(SCHEMAS).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set headers if empty or new
    if (sheet.getLastRow() === 0) {
      const headers = SCHEMAS[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Header Styling: Dark Navy background, White text, Bold, Centered
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1E293B");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Segoe UI");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
  });

  // Remove default "Sheet1" or "Sheet 1" if other sheets exist
  const defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Sheet 1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  // 2. Populate Standard Indonesian SAK EMKM Chart of Accounts (COA)
  const coaSheet = ss.getSheetByName(CONFIG.SHEETS.COA);
  if (coaSheet.getLastRow() <= 1) {
    const defaultCOA = [
      // AKTIVA LANCAR (Current Assets)
      ["1-1110", "Kas Operasional Kantor", "Asset", "Kas & Setara Kas", "D", 15000000, 15000000, "TRUE"],
      ["1-1120", "Bank Mandiri Rekening Giro", "Asset", "Kas & Setara Kas", "D", 75000000, 75000000, "TRUE"],
      ["1-1130", "Bank BCA Rekening Operasional", "Asset", "Kas & Setara Kas", "D", 45000000, 45000000, "TRUE"],
      ["1-1200", "Piutang Usaha (AR)", "Asset", "Piutang", "D", 28000000, 28000000, "TRUE"],
      ["1-1300", "Persediaan Barang Dagang", "Asset", "Persediaan", "D", 35000000, 35000000, "TRUE"],
      ["1-1400", "Uang Muka & Biaya Dibayar Dimuka", "Asset", "Aset Lancar Lainnya", "D", 5000000, 5000000, "TRUE"],

      // AKTIVA TETAP (Fixed Assets)
      ["1-2100", "Peralatan & Mesin Kantor", "Asset", "Aset Tetap", "D", 40000000, 40000000, "TRUE"],
      ["1-2200", "Akumulasi Penyusutan Peralatan", "Asset", "Akumulasi Penyusutan", "K", 8000000, 8000000, "TRUE"],
      ["1-2300", "Kendaraan Operasional", "Asset", "Aset Tetap", "D", 85000000, 85000000, "TRUE"],
      ["1-2400", "Akumulasi Penyusutan Kendaraan", "Asset", "Akumulasi Penyusutan", "K", 15000000, 15000000, "TRUE"],

      // KEWAJIBAN LANCAR (Current Liabilities)
      ["2-1100", "Utang Usaha (AP)", "Liability", "Kewajiban Lancar", "K", 22000000, 22000000, "TRUE"],
      ["2-1200", "Utang Gaji & Operasional", "Liability", "Kewajiban Lancar", "K", 0, 0, "TRUE"],
      ["2-1300", "Utang Pajak (PPN / PPh 21/23)", "Liability", "Kewajiban Lancar", "K", 3500000, 3500000, "TRUE"],
      ["2-1400", "Utang Gaji & Potongan Lainnya", "Liability", "Kewajiban Lancar", "K", 0, 0, "TRUE"],

      // KEWAJIBAN JANGKA PANJANG
      ["2-2100", "Utang Bank Jangka Panjang", "Liability", "Kewajiban Jangka Panjang", "K", 50000000, 50000000, "TRUE"],

      // EKUITAS (Equity)
      ["3-1000", "Modal Disetor Pemilik", "Equity", "Modal Saham", "K", 200000000, 200000000, "TRUE"],
      ["3-2000", "Saldo Laba Ditahan (Retained Earnings)", "Equity", "Laba Ditahan", "K", 39500000, 39500000, "TRUE"],
      ["3-3000", "Prive Pemilik", "Equity", "Prive", "D", 0, 0, "TRUE"],

      // PENDAPATAN (Revenue)
      ["4-1000", "Pendapatan Penjualan Jasa & Produk", "Revenue", "Pendapatan Operasional", "K", 0, 0, "TRUE"],
      ["4-2000", "Pendapatan Bunga & Lain-lain", "Revenue", "Pendapatan Non-Operasional", "K", 0, 0, "TRUE"],

      // HARGA POKOK PENJUALAN (COGS)
      ["5-1000", "Beban Pokok Penjualan (HPP)", "Expense", "HPP", "D", 0, 0, "TRUE"],

      // BEBAN OPERASIONAL (Operating Expenses)
      ["6-1000", "Beban Operasional Kantor Umum", "Expense", "Beban Operasional", "D", 0, 0, "TRUE"],
      ["6-1100", "Beban Gaji & Upah Karyawan", "Expense", "Beban SDM", "D", 0, 0, "TRUE"],
      ["6-1200", "Beban Sewa Gedung & Ruang Kantor", "Expense", "Beban Sewa", "D", 0, 0, "TRUE"],
      ["6-1300", "Beban Listrik, Air, & Internet", "Expense", "Beban Utilitas", "D", 0, 0, "TRUE"],
      ["6-1400", "Beban Pemasaran & Iklan", "Expense", "Beban Pemasaran", "D", 0, 0, "TRUE"],
      ["6-1500", "Beban Transportasi & Perjalanan Dinas", "Expense", "Beban Operasional", "D", 0, 0, "TRUE"],
      ["6-1600", "Beban Penyusutan Aset Tetap", "Expense", "Beban Penyusutan", "D", 0, 0, "TRUE"],
      ["6-2000", "Beban Pajak & Administrasi Bank", "Expense", "Beban Lain-lain", "D", 0, 0, "TRUE"]
    ];
    coaSheet.getRange(2, 1, defaultCOA.length, defaultCOA[0].length).setValues(defaultCOA);
  }

  // 3. Populate Config_Tenant
  const configSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG_TENANT);
  if (configSheet.getLastRow() <= 1) {
    const tenantData = [[
      "PT Inovasi Keuangan Nusantara", 
      "Sudirman Central Business District (SCBD) Lot 28, Senayan, Jakarta Selatan 12190",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      "LIC-ENTERPRISE-ID-2026-9988",
      "Active",
      50000,
      "Rp",
      "2026",
      11,
      Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss")
    ]];
    configSheet.getRange(2, 1, 1, tenantData[0].length).setValues(tenantData);
  }

  // 4. Populate Default Users
  const userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS_AUTH);
  if (userSheet.getLastRow() <= 1) {
    const adminHash = AuthController.hashPassword("admin123");
    const financeHash = AuthController.hashPassword("finance123");
    const auditorHash = AuthController.hashPassword("auditor123");

    const defaultUsers = [
      ["USR-001", "admin", "Super Administrator ERP", adminHash, "Superadmin", "Active", ""],
      ["USR-002", "finance", "Fathir Ar-Razi (Head of Finance)", financeHash, "Finance", "Active", ""],
      ["USR-003", "auditor", "Sarah Wijaya (Lead Auditor)", auditorHash, "Auditor", "Active", ""]
    ];
    userSheet.getRange(2, 1, defaultUsers.length, defaultUsers[0].length).setValues(defaultUsers);
  }

  // 5. Populate Rich Sample Inventory Items
  const invSheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY);
  if (invSheet.getLastRow() <= 1) {
    const nowStr = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    const sampleInventory = [
      ["SKU-SRV-01", "Paket Cloud Server Enterprise 8-Core", "Unit", 15000000, 22500000, 12, 3, "1-1300", "5-1000", nowStr],
      ["SKU-POS-02", "Hardware POS Terminal SmartTouch Pro", "Unit", 3500000, 5200000, 24, 5, "1-1300", "5-1000", nowStr],
      ["SKU-SFT-03", "Lisensi Software ERP Annual Multi-Branch", "Lisensi", 12000000, 18000000, 48, 10, "1-1300", "5-1000", nowStr],
      ["SKU-IOT-04", "IoT Gateway Controller Enterprise", "Unit", 4200000, 6800000, 18, 4, "1-1300", "5-1000", nowStr],
      ["SKU-UPS-05", "Industrial UPS Backup Power 3000VA", "Unit", 6500000, 9500000, 8, 2, "1-1300", "5-1000", nowStr],
      ["SKU-SCN-06", "Wireless 2D Barcode & QR Scanner", "Unit", 1100000, 1750000, 35, 8, "1-1300", "5-1000", nowStr]
    ];
    invSheet.getRange(2, 1, sampleInventory.length, sampleInventory[0].length).setValues(sampleInventory);
  }

  // 6. Populate Extensive Sample Kas/Bank Transactions
  const kasSheet = ss.getSheetByName(CONFIG.SHEETS.KAS_BANK);
  if (kasSheet.getLastRow() <= 1) {
    const today = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const sampleKas = [
      ["KB-20260901-001", "2026-09-01", "4-1000", "1-1120", "IN", 45000000, "Penerimaan Termin 1 Jasa Konsultasi ERP - PT Mitra Global", "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400", "finance", today],
      ["KB-20260902-002", "2026-09-02", "1-1120", "6-1200", "OUT", 12500000, "Pembayaran Sewa Gedung SCBD Kantor Bulan September", "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400", "finance", today],
      ["KB-20260903-003", "2026-09-03", "1-1120", "1-1110", "TRANSFER", 8000000, "Pengisian Kas Kecil Operasional Harian Kantor", "", "admin", today],
      ["KB-20260905-004", "2026-09-05", "4-1000", "1-1130", "IN", 27500000, "Pelunasan Faktur Penjualan POS Pro - CV Borneo Prima", "", "finance", today],
      ["KB-20260906-005", "2026-09-06", "1-1120", "6-1300", "OUT", 4500000, "Pembayaran Dedicated Fiber Internet 1Gbps & Cloud AWS", "", "finance", today],
      ["KB-20260908-006", "2026-09-08", "4-1000", "1-1120", "IN", 36000000, "Penjualan 2 Lisensi ERP Multi-Branch - PT Sinar Abadi", "", "finance", today],
      ["KB-20260909-007", "2026-09-09", "1-1110", "6-1000", "OUT", 1850000, "Pembelian Perlengkapan & Pantry Meeting Klien", "", "finance", today],
      ["KB-20260910-008", "2026-09-10", "1-1130", "6-1400", "OUT", 6500000, "Beban Kampanye Iklan Digital Google Ads & LinkedIn B2B", "", "finance", today]
    ];
    kasSheet.getRange(2, 1, sampleKas.length, sampleKas[0].length).setValues(sampleKas);
  }

  // 7. Populate Realistic Sample Invoices (AR)
  const arSheet = ss.getSheetByName(CONFIG.SHEETS.INVOICES_AR);
  if (arSheet.getLastRow() <= 1) {
    const today = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const sampleInvoices = [
      [
        "INV-20260901-1001", "2026-09-01", "2026-09-15", "PT Sinar Mandiri Megah",
        JSON.stringify([{ sku: "SKU-SRV-01", name: "Paket Cloud Server Enterprise 8-Core", qty: 2, unitPrice: 22500000 }]),
        45000000, 4950000, 49950000, 49950000, "Paid", "Lunas via Transfer Bank Mandiri Giro", today
      ],
      [
        "INV-20260905-1002", "2026-09-05", "2026-09-20", "PT Mitra Global Solusindo",
        JSON.stringify([
          { sku: "SKU-SFT-03", name: "Lisensi Software ERP Annual Multi-Branch", qty: 1, unitPrice: 18000000 },
          { sku: "SKU-POS-02", name: "Hardware POS Terminal SmartTouch Pro", qty: 2, unitPrice: 5200000 }
        ]),
        28400000, 3124000, 31524000, 0, "Sent", "Tagihan dikirim via email Finance Dept (Jatuh tempo 14 hari)", today
      ],
      [
        "INV-20260908-1003", "2026-09-08", "2026-09-14", "CV Sentosa Jaya Logistik",
        JSON.stringify([{ sku: "SKU-IOT-04", name: "IoT Gateway Controller Enterprise", qty: 3, unitPrice: 6800000 }]),
        20400000, 2244000, 22644000, 0, "Sent", "Alert H-3: Jatuh tempo dalam 2 hari ke depan", today
      ],
      [
        "INV-20260815-1004", "2026-08-15", "2026-08-30", "PT Samudera Niaga Perkasa",
        JSON.stringify([{ sku: "SKU-POS-02", name: "Hardware POS Terminal SmartTouch Pro", qty: 4, unitPrice: 5200000 }]),
        20800000, 2288000, 23088000, 0, "Overdue", "Overdue: Tagihan telah melewati jatuh tempo, segera lakukan follow-up!", today
      ],
      [
        "INV-20260825-1005", "2026-08-25", "2026-09-10", "CV Borneo Prima Abadi",
        JSON.stringify([{ sku: "SKU-UPS-05", name: "Industrial UPS Backup Power 3000VA", qty: 2, unitPrice: 9500000 }]),
        19000000, 2090000, 21090000, 21090000, "Paid", "Lunas via Bank BCA Operasional", today
      ]
    ];
    arSheet.getRange(2, 1, sampleInvoices.length, sampleInvoices[0].length).setValues(sampleInvoices);
  }

  // 8. Populate Sample Expenses (AP)
  const apSheet = ss.getSheetByName(CONFIG.SHEETS.EXPENSES_AP);
  if (apSheet.getLastRow() <= 1) {
    const today = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const sampleBills = [
      ["EXP-20260901-2001", "2026-09-01", "2026-09-20", "PT Telekomunikasi Indonesia", "6-1300", "Tagihan Dedicated Fiber Internet 1Gbps", 4500000, "Unpaid", "", "", "", today],
      ["EXP-20260903-2002", "2026-09-03", "2026-09-15", "PT Cipta Media Ads Global", "6-1400", "Kampanye Iklan LinkedIn & Google Ads B2B", 6500000, "Unpaid", "", "", "", today],
      ["EXP-20260820-2003", "2026-08-20", "2026-09-05", "Vendor Ekspedisi Logistik Kilat", "6-1500", "Biaya Ekspedisi Pengiriman Hardware POS", 1850000, "Overdue", "", "", "", today],
      ["EXP-20260901-2004", "2026-09-01", "2026-09-05", "KAP Haryanto & Rekan", "6-1000", "Jasa Audit Finansial & Konsultasi Pajak Tahunan", 15000000, "Paid", "", "2026-09-04", "1-1120", today],
      ["EXP-20260902-2005", "2026-09-02", "2026-09-14", "BPJS Ketenagakerjaan", "6-1100", "Iuran BPJS Ketenagakerjaan & Kesehatan Staf", 3800000, "Unpaid", "", "", "", today]
    ];
    apSheet.getRange(2, 1, sampleBills.length, sampleBills[0].length).setValues(sampleBills);
  }

  // 9. Populate Sample Payroll (Gaji Karyawan)
  const payrollSheet = ss.getSheetByName(CONFIG.SHEETS.PAYROLL);
  if (payrollSheet.getLastRow() <= 1) {
    const samplePayroll = [
      ["PAY-202608-8801", "Agustus 2026", "EMP-101", "Fathir Ar-Razi, SE., Ak.", 14000000, 3500000, 750000, 16750000, "2026-08-28", "Paid", "6-1100", "1-1120"],
      ["PAY-202608-8802", "Agustus 2026", "EMP-102", "Dewi Lestari, S.Kom.", 11500000, 2500000, 500000, 13500000, "2026-08-28", "Paid", "6-1100", "1-1120"],
      ["PAY-202608-8803", "Agustus 2026", "EMP-103", "Budi Pratama, S.T.", 10000000, 2000000, 450000, 11550000, "2026-08-28", "Paid", "6-1100", "1-1120"],
      ["PAY-202608-8804", "Agustus 2026", "EMP-104", "Siti Rahmawati, S.Ds.", 8500000, 1500000, 350000, 9650000, "2026-08-28", "Paid", "6-1100", "1-1120"]
    ];
    payrollSheet.getRange(2, 1, samplePayroll.length, samplePayroll[0].length).setValues(samplePayroll);
  }

  // 10. Populate Initial Balanced Journals (Jurnal Umum)
  const jrnSheet = ss.getSheetByName(CONFIG.SHEETS.JURNAL_UMUM);
  if (jrnSheet.getLastRow() <= 1) {
    const nowStr = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    const sampleJournals = [
      ["JRN-20260901-001", "2026-09-01", "1-1120", "Bank Mandiri Rek Giro", "Penerimaan Jasa Konsultasi ERP", 45000000, 0, "KB-20260901-001", "KasBank", "finance", nowStr],
      ["JRN-20260901-001", "2026-09-01", "4-1000", "Pendapatan Penjualan & Jasa", "Penerimaan Jasa Konsultasi ERP", 0, 45000000, "KB-20260901-001", "KasBank", "finance", nowStr],
      ["JRN-20260902-002", "2026-09-02", "6-1200", "Beban Sewa Gedung Kantor", "Pembayaran Sewa Kantor Sept", 12500000, 0, "KB-20260902-002", "KasBank", "finance", nowStr],
      ["JRN-20260902-002", "2026-09-02", "1-1120", "Bank Mandiri Rek Giro", "Pembayaran Sewa Kantor Sept", 0, 12500000, "KB-20260902-002", "KasBank", "finance", nowStr],
      ["JRN-20260905-003", "2026-09-05", "1-1130", "Bank BCA Rek Operasional", "Pelunasan Faktur POS Pro", 27500000, 0, "KB-20260905-004", "KasBank", "finance", nowStr],
      ["JRN-20260905-003", "2026-09-05", "4-1000", "Pendapatan Penjualan & Jasa", "Pelunasan Faktur POS Pro", 0, 27500000, "KB-20260905-004", "KasBank", "finance", nowStr],
      ["JRN-20260906-004", "2026-09-06", "6-1300", "Beban Listrik, Air & Internet", "Pembayaran Dedicated Internet & Cloud", 4500000, 0, "KB-20260906-005", "KasBank", "finance", nowStr],
      ["JRN-20260906-004", "2026-09-06", "1-1120", "Bank Mandiri Rek Giro", "Pembayaran Dedicated Internet & Cloud", 0, 4500000, "KB-20260906-005", "KasBank", "finance", nowStr]
    ];
    jrnSheet.getRange(2, 1, sampleJournals.length, sampleJournals[0].length).setValues(sampleJournals);
  }

  // Auto-resize all columns across all sheets
  ss.getSheets().forEach(sheet => {
    for (let c = 1; c <= sheet.getLastColumn(); c++) {
      sheet.autoResizeColumn(c);
    }
  });

  return "Inisialisasi Database Selesai! Semua 9 Sheet & Akun SAK EMKM Berhasil Dibuat.";
}
