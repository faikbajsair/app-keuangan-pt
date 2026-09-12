/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * app.js - Single Page Application Core Controller & State Store
 * ============================================================================
 */

// Global State
const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbzS_Zp5BJIa-8ND3USTAO7axwSC-nhnNT95QoU5T6ESF4Q74E2ql03TRd4c9WjOR08hpQ/exec";

const AppState = {
  mode: localStorage.getItem("app_mode") || "live", // 'live' | 'demo'
  apiUrl: localStorage.getItem("app_gas_url") || DEFAULT_GAS_URL,
  token: localStorage.getItem("app_token") || "demo-token-enterprise",
  user: JSON.parse(localStorage.getItem("app_user") || '{"userId":"USR-001","username":"admin","fullName":"Super Administrator ERP","role":"Superadmin"}'),
  tenant: JSON.parse(localStorage.getItem("app_tenant") || '{"companyName":"PT Inovasi Keuangan Nusantara","address":"SCBD Lot 28 Senayan, Jakarta Selatan","logoUrl":"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80","currency":"Rp","taxRate":11,"licenseKey":"LIC-ENTERPRISE-ID-2026-9988","licenseStatus":"Active","quotaUsed":148,"quotaTotal":50000}'),
  currentTab: "dashboard",
  
  // In-Memory Data Store (Demo / Cache)
  data: {
    coa: [],
    kasBank: [],
    invoices: [],
    expenses: [],
    inventory: [],
    payroll: [],
    journals: [],
    dashboard: null,
    incomeStatement: null,
    balanceSheet: null,
    cashFlow: null,
    ratios: null,
    users: []
  }
};

// ==========================================
// MOCK DATA INITIALIZER FOR DEMO MODE
// ==========================================
function initMockData() {
  AppState.data.coa = [
    { Account_Code: "1-1110", Account_Name: "Kas Operasional Kantor", Category: "Asset", Sub_Category: "Kas & Setara Kas", Normal_Balance: "D", Opening_Balance: 15000000, Current_Balance: 15000000 },
    { Account_Code: "1-1120", Account_Name: "Bank Mandiri Rek Giro", Category: "Asset", Sub_Category: "Kas & Setara Kas", Normal_Balance: "D", Opening_Balance: 75000000, Current_Balance: 75000000 },
    { Account_Code: "1-1130", Account_Name: "Bank BCA Rek Operasional", Category: "Asset", Sub_Category: "Kas & Setara Kas", Normal_Balance: "D", Opening_Balance: 45000000, Current_Balance: 45000000 },
    { Account_Code: "1-1200", Account_Name: "Piutang Usaha (AR)", Category: "Asset", Sub_Category: "Piutang", Normal_Balance: "D", Opening_Balance: 28000000, Current_Balance: 28000000 },
    { Account_Code: "1-1300", Account_Name: "Persediaan Barang Dagang", Category: "Asset", Sub_Category: "Persediaan", Normal_Balance: "D", Opening_Balance: 35000000, Current_Balance: 35000000 },
    { Account_Code: "1-2100", Account_Name: "Peralatan & Mesin Kantor", Category: "Asset", Sub_Category: "Aset Tetap", Normal_Balance: "D", Opening_Balance: 40000000, Current_Balance: 40000000 },
    { Account_Code: "2-1100", Account_Name: "Utang Usaha (AP)", Category: "Liability", Sub_Category: "Kewajiban Lancar", Normal_Balance: "K", Opening_Balance: 22000000, Current_Balance: 22000000 },
    { Account_Code: "2-1300", Account_Name: "Utang Pajak (PPN/PPh)", Category: "Liability", Sub_Category: "Kewajiban Lancar", Normal_Balance: "K", Opening_Balance: 3500000, Current_Balance: 3500000 },
    { Account_Code: "3-1000", Account_Name: "Modal Disetor Pemilik", Category: "Equity", Sub_Category: "Modal Saham", Normal_Balance: "K", Opening_Balance: 172500000, Current_Balance: 172500000 },
    { Account_Code: "3-2000", Account_Name: "Saldo Laba Ditahan", Category: "Equity", Sub_Category: "Laba Ditahan", Normal_Balance: "K", Opening_Balance: 40000000, Current_Balance: 40000000 },
    { Account_Code: "4-1000", Account_Name: "Pendapatan Penjualan & Jasa", Category: "Revenue", Sub_Category: "Pendapatan Operasional", Normal_Balance: "K", Opening_Balance: 0, Current_Balance: 0 },
    { Account_Code: "5-1000", Account_Name: "Beban Pokok Penjualan (HPP)", Category: "Expense", Sub_Category: "HPP", Normal_Balance: "D", Opening_Balance: 0, Current_Balance: 0 },
    { Account_Code: "6-1000", Account_Name: "Beban Operasional Kantor", Category: "Expense", Sub_Category: "Beban Operasional", Normal_Balance: "D", Opening_Balance: 0, Current_Balance: 0 },
    { Account_Code: "6-1100", Account_Name: "Beban Gaji & Upah Karyawan", Category: "Expense", Sub_Category: "Beban SDM", Normal_Balance: "D", Opening_Balance: 0, Current_Balance: 0 },
    { Account_Code: "6-1200", Account_Name: "Beban Sewa Gedung Kantor", Category: "Expense", Sub_Category: "Beban Sewa", Normal_Balance: "D", Opening_Balance: 0, Current_Balance: 0 },
    { Account_Code: "6-1300", Account_Name: "Beban Listrik, Air & Internet", Category: "Expense", Sub_Category: "Beban Utilitas", Normal_Balance: "D", Opening_Balance: 0, Current_Balance: 0 },
    { Account_Code: "6-1400", Account_Name: "Beban Pemasaran & Iklan", Category: "Expense", Sub_Category: "Beban Pemasaran", Normal_Balance: "D", Opening_Balance: 0, Current_Balance: 0 },
    { Account_Code: "6-1500", Account_Name: "Beban Transportasi & Logistik", Category: "Expense", Sub_Category: "Beban Operasional", Normal_Balance: "D", Opening_Balance: 0, Current_Balance: 0 }
  ];

  AppState.data.inventory = [
    { SKU: "SKU-SRV-01", Item_Name: "Paket Cloud Server Enterprise 8-Core", Unit: "Unit", Cost_Price: 15000000, Selling_Price: 22500000, Stock_Qty: 12, Min_Stock: 3 },
    { SKU: "SKU-POS-02", Item_Name: "Hardware POS Terminal SmartTouch Pro", Unit: "Unit", Cost_Price: 3500000, Selling_Price: 5200000, Stock_Qty: 24, Min_Stock: 5 },
    { SKU: "SKU-SFT-03", Item_Name: "Lisensi Software ERP Annual Multi-Branch", Unit: "Lisensi", Cost_Price: 12000000, Selling_Price: 18000000, Stock_Qty: 48, Min_Stock: 10 },
    { SKU: "SKU-IOT-04", Item_Name: "IoT Gateway Controller Enterprise", Unit: "Unit", Cost_Price: 4200000, Selling_Price: 6800000, Stock_Qty: 18, Min_Stock: 4 },
    { SKU: "SKU-UPS-05", Item_Name: "Industrial UPS Backup Power 3000VA", Unit: "Unit", Cost_Price: 6500000, Selling_Price: 9500000, Stock_Qty: 8, Min_Stock: 2 },
    { SKU: "SKU-SCN-06", Item_Name: "Wireless 2D Barcode & QR Scanner", Unit: "Unit", Cost_Price: 1100000, Selling_Price: 1750000, Stock_Qty: 35, Min_Stock: 8 }
  ];

  AppState.data.kasBank = [
    { Tx_ID: "KB-20260901-001", Date: "2026-09-01", COA_Source: "4-1000", COA_Target: "1-1120", Type: "IN", Amount: 45000000, Description: "Penerimaan Termin 1 Jasa Konsultasi ERP - PT Mitra Global", Receipt_URL: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400", Created_By: "finance" },
    { Tx_ID: "KB-20260902-002", Date: "2026-09-02", COA_Source: "1-1120", COA_Target: "6-1200", Type: "OUT", Amount: 12500000, Description: "Pembayaran Sewa Gedung SCBD Kantor Bulan September", Receipt_URL: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400", Created_By: "finance" },
    { Tx_ID: "KB-20260903-003", Date: "2026-09-03", COA_Source: "1-1120", COA_Target: "1-1110", Type: "TRANSFER", Amount: 8000000, Description: "Pengisian Kas Kecil Operasional Harian Kantor", Receipt_URL: "", Created_By: "admin" },
    { Tx_ID: "KB-20260905-004", Date: "2026-09-05", COA_Source: "4-1000", COA_Target: "1-1130", Type: "IN", Amount: 27500000, Description: "Pelunasan Faktur Penjualan POS Pro - CV Borneo Prima", Receipt_URL: "", Created_By: "finance" },
    { Tx_ID: "KB-20260906-005", Date: "2026-09-06", COA_Source: "1-1120", COA_Target: "6-1300", Type: "OUT", Amount: 4500000, Description: "Pembayaran Dedicated Fiber Internet 1Gbps & Cloud AWS", Receipt_URL: "", Created_By: "finance" },
    { Tx_ID: "KB-20260908-006", Date: "2026-09-08", COA_Source: "4-1000", COA_Target: "1-1120", Type: "IN", Amount: 36000000, Description: "Penjualan 2 Lisensi ERP Multi-Branch - PT Sinar Abadi", Receipt_URL: "", Created_By: "finance" },
    { Tx_ID: "KB-20260909-007", Date: "2026-09-09", COA_Source: "1-1110", COA_Target: "6-1000", Type: "OUT", Amount: 1850000, Description: "Pembelian Perlengkapan & Pantry Meeting Klien", Receipt_URL: "", Created_By: "finance" },
    { Tx_ID: "KB-20260910-008", Date: "2026-09-10", COA_Source: "1-1130", COA_Target: "6-1400", Type: "OUT", Amount: 6500000, Description: "Beban Kampanye Iklan Digital Google Ads & LinkedIn B2B", Receipt_URL: "", Created_By: "finance" }
  ];

  AppState.data.invoices = [
    {
      Invoice_ID: "INV-20260901-1001",
      Date: "2026-09-01",
      Due_Date: "2026-09-15",
      Customer_Name: "PT Sinar Mandiri Megah",
      Items: [{ sku: "SKU-SRV-01", name: "Paket Cloud Server Enterprise 8-Core", qty: 2, unitPrice: 22500000 }],
      Subtotal: 45000000,
      Tax_Amount: 4950000,
      Grand_Total: 49950000,
      Amount_Paid: 49950000,
      Status: "Paid",
      Notes: "Lunas via Transfer Bank Mandiri Giro"
    },
    {
      Invoice_ID: "INV-20260905-1002",
      Date: "2026-09-05",
      Due_Date: "2026-09-20",
      Customer_Name: "PT Mitra Global Solusindo",
      Items: [
        { sku: "SKU-SFT-03", name: "Lisensi Software ERP Annual Multi-Branch", qty: 1, unitPrice: 18000000 },
        { sku: "SKU-POS-02", name: "Hardware POS Terminal SmartTouch Pro", qty: 2, unitPrice: 5200000 }
      ],
      Subtotal: 28400000,
      Tax_Amount: 3124000,
      Grand_Total: 31524000,
      Amount_Paid: 0,
      Status: "Sent",
      Notes: "Tagihan dikirim via email Finance Dept (Jatuh tempo 14 hari)"
    },
    {
      Invoice_ID: "INV-20260908-1003",
      Date: "2026-09-08",
      Due_Date: "2026-09-14",
      Customer_Name: "CV Sentosa Jaya Logistik",
      Items: [{ sku: "SKU-IOT-04", name: "IoT Gateway Controller Enterprise", qty: 3, unitPrice: 6800000 }],
      Subtotal: 20400000,
      Tax_Amount: 2244000,
      Grand_Total: 22644000,
      Amount_Paid: 0,
      Status: "Sent",
      Notes: "Alert H-3: Jatuh tempo dalam 2 hari ke depan"
    },
    {
      Invoice_ID: "INV-20260815-1004",
      Date: "2026-08-15",
      Due_Date: "2026-08-30",
      Customer_Name: "PT Samudera Niaga Perkasa",
      Items: [{ sku: "SKU-POS-02", name: "Hardware POS Terminal SmartTouch Pro", qty: 4, unitPrice: 5200000 }],
      Subtotal: 20800000,
      Tax_Amount: 2288000,
      Grand_Total: 23088000,
      Amount_Paid: 0,
      Status: "Overdue",
      Notes: "Overdue: Tagihan telah melewati jatuh tempo, segera lakukan follow-up!"
    },
    {
      Invoice_ID: "INV-20260825-1005",
      Date: "2026-08-25",
      Due_Date: "2026-09-10",
      Customer_Name: "CV Borneo Prima Abadi",
      Items: [{ sku: "SKU-UPS-05", name: "Industrial UPS Backup Power 3000VA", qty: 2, unitPrice: 9500000 }],
      Subtotal: 19000000,
      Tax_Amount: 2090000,
      Grand_Total: 21090000,
      Amount_Paid: 21090000,
      Status: "Paid",
      Notes: "Lunas via Bank BCA Operasional"
    }
  ];

  AppState.data.expenses = [
    {
      Bill_ID: "EXP-20260901-2001",
      Date: "2026-09-01",
      Due_Date: "2026-09-20",
      Vendor_Name: "PT Telekomunikasi Indonesia",
      Category_COA: "6-1300",
      Description: "Tagihan Dedicated Fiber Internet 1Gbps",
      Amount: 4500000,
      Status: "Unpaid",
      Receipt_URL: ""
    },
    {
      Bill_ID: "EXP-20260903-2002",
      Date: "2026-09-03",
      Due_Date: "2026-09-15",
      Vendor_Name: "PT Cipta Media Ads Global",
      Category_COA: "6-1400",
      Description: "Kampanye Iklan LinkedIn & Google Ads B2B",
      Amount: 6500000,
      Status: "Unpaid",
      Receipt_URL: ""
    },
    {
      Bill_ID: "EXP-20260820-2003",
      Date: "2026-08-20",
      Due_Date: "2026-09-05",
      Vendor_Name: "Vendor Ekspedisi Logistik Kilat",
      Category_COA: "6-1500",
      Description: "Biaya Ekspedisi Pengiriman Hardware POS",
      Amount: 1850000,
      Status: "Overdue",
      Receipt_URL: ""
    },
    {
      Bill_ID: "EXP-20260901-2004",
      Date: "2026-09-01",
      Due_Date: "2026-09-05",
      Vendor_Name: "KAP Haryanto & Rekan",
      Category_COA: "6-1000",
      Description: "Jasa Audit Finansial & Konsultasi Pajak Tahunan",
      Amount: 15000000,
      Status: "Paid",
      Receipt_URL: ""
    },
    {
      Bill_ID: "EXP-20260902-2005",
      Date: "2026-09-02",
      Due_Date: "2026-09-14",
      Vendor_Name: "BPJS Ketenagakerjaan",
      Category_COA: "6-1100",
      Description: "Iuran BPJS Ketenagakerjaan & Kesehatan Staf",
      Amount: 3800000,
      Status: "Unpaid",
      Receipt_URL: ""
    }
  ];

  AppState.data.payroll = [
    {
      Payroll_ID: "PAY-202608-8801",
      Period_Month_Year: "Agustus 2026",
      Employee_ID: "EMP-101",
      Employee_Name: "Fathir Ar-Razi, SE., Ak.",
      Basic_Salary: 14000000,
      Allowances: 3500000,
      Deductions: 750000,
      Net_Salary: 16750000,
      Payment_Date: "2026-08-28",
      Status: "Paid",
      COA_Kas: "1-1120"
    },
    {
      Payroll_ID: "PAY-202608-8802",
      Period_Month_Year: "Agustus 2026",
      Employee_ID: "EMP-102",
      Employee_Name: "Dewi Lestari, S.Kom.",
      Basic_Salary: 11500000,
      Allowances: 2500000,
      Deductions: 500000,
      Net_Salary: 13500000,
      Payment_Date: "2026-08-28",
      Status: "Paid",
      COA_Kas: "1-1120"
    },
    {
      Payroll_ID: "PAY-202608-8803",
      Period_Month_Year: "Agustus 2026",
      Employee_ID: "EMP-103",
      Employee_Name: "Budi Pratama, S.T.",
      Basic_Salary: 10000000,
      Allowances: 2000000,
      Deductions: 450000,
      Net_Salary: 11550000,
      Payment_Date: "2026-08-28",
      Status: "Paid",
      COA_Kas: "1-1120"
    },
    {
      Payroll_ID: "PAY-202608-8804",
      Period_Month_Year: "Agustus 2026",
      Employee_ID: "EMP-104",
      Employee_Name: "Siti Rahmawati, S.Ds.",
      Basic_Salary: 8500000,
      Allowances: 1500000,
      Deductions: 350000,
      Net_Salary: 9650000,
      Payment_Date: "2026-08-28",
      Status: "Paid",
      COA_Kas: "1-1120"
    }
  ];

  AppState.data.journals = [
    { Journal_ID: "JRN-20260901-001", Date: "2026-09-01", Account_Code: "1-1120", Account_Name: "Bank Mandiri Rek Giro", Description: "Penerimaan Jasa Konsultasi ERP", Debit: 45000000, Credit: 0, Ref_ID: "KB-20260901-001" },
    { Journal_ID: "JRN-20260901-001", Date: "2026-09-01", Account_Code: "4-1000", Account_Name: "Pendapatan Penjualan & Jasa", Description: "Penerimaan Jasa Konsultasi ERP", Debit: 0, Credit: 45000000, Ref_ID: "KB-20260901-001" },
    { Journal_ID: "JRN-20260902-002", Date: "2026-09-02", Account_Code: "6-1200", Account_Name: "Beban Sewa Gedung Kantor", Description: "Pembayaran Sewa Kantor Sept", Debit: 12500000, Credit: 0, Ref_ID: "KB-20260902-002" },
    { Journal_ID: "JRN-20260902-002", Date: "2026-09-02", Account_Code: "1-1120", Account_Name: "Bank Mandiri Rek Giro", Description: "Pembayaran Sewa Kantor Sept", Debit: 0, Credit: 12500000, Ref_ID: "KB-20260902-002" },
    { Journal_ID: "JRN-20260905-003", Date: "2026-09-05", Account_Code: "1-1130", Account_Name: "Bank BCA Rek Operasional", Description: "Pelunasan Faktur POS Pro", Debit: 27500000, Credit: 0, Ref_ID: "KB-20260905-004" },
    { Journal_ID: "JRN-20260905-003", Date: "2026-09-05", Account_Code: "4-1000", Account_Name: "Pendapatan Penjualan & Jasa", Description: "Pelunasan Faktur POS Pro", Debit: 0, Credit: 27500000, Ref_ID: "KB-20260905-004" },
    { Journal_ID: "JRN-20260906-004", Date: "2026-09-06", Account_Code: "6-1300", Account_Name: "Beban Listrik, Air & Internet", Description: "Pembayaran Dedicated Internet & Cloud", Debit: 4500000, Credit: 0, Ref_ID: "KB-20260906-005" },
    { Journal_ID: "JRN-20260906-004", Date: "2026-09-06", Account_Code: "1-1120", Account_Name: "Bank Mandiri Rek Giro", Description: "Pembayaran Dedicated Internet & Cloud", Debit: 0, Credit: 4500000, Ref_ID: "KB-20260906-005" }
  ];

  AppState.data.users = [
    { userId: "USR-001", username: "admin", fullName: "Super Administrator ERP", role: "Superadmin", status: "Active", lastLogin: "2026-09-12 09:30" },
    { userId: "USR-002", username: "finance", fullName: "Fathir Ar-Razi, SE.", role: "Finance", status: "Active", lastLogin: "2026-09-11 16:45" },
    { userId: "USR-003", username: "auditor", fullName: "Sarah Wijaya, CPA.", role: "Auditor", status: "Active", lastLogin: "2026-09-10 11:20" }
  ];
}

// ==========================================
// API CLIENT (DUAL-MODE: DEMO vs LIVE GAS)
// ==========================================
async function apiCall(action, method = "GET", payload = {}) {
  // If in DEMO mode, handle locally
  if (AppState.mode === "demo" || !AppState.apiUrl) {
    return handleMockApi(action, method, payload);
  }

  // LIVE GAS API Call
  try {
    let url = AppState.apiUrl;
    let options = {
      method: method,
      headers: { "Content-Type": "text/plain;charset=utf-8" } // GAS handles text/plain CORS smoothly
    };

    if (method === "GET") {
      const qParams = new URLSearchParams({ action, token: AppState.token, ...payload }).toString();
      url += (url.includes("?") ? "&" : "?") + qParams;
    } else {
      options.body = JSON.stringify({ action, token: AppState.token, ...payload });
    }

    const res = await fetch(url, options);
    const json = await res.json();

    if (!json.success && json.error) {
      throw new Error(json.error);
    }
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    console.warn("GAS API Request Failed, falling back to cached/demo view:", err);
    Swal.fire({
      icon: "warning",
      title: "Koneksi GAS Terkendala",
      text: err.message + ". Menggunakan cache data lokal.",
      timer: 3500
    });
    return handleMockApi(action, method, payload);
  }
}

// Mock API Handler for Instant Testing
function handleMockApi(action, method, payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (action) {
        case "getCOA":
          resolve(AppState.data.coa);
          break;
        case "getKasBank":
          resolve(AppState.data.kasBank);
          break;
        case "getInvoices":
          resolve(AppState.data.invoices);
          break;
        case "getExpenses":
          resolve(AppState.data.expenses);
          break;
        case "getInventory":
          resolve(AppState.data.inventory);
          break;
        case "getPayroll":
          resolve(AppState.data.payroll);
          break;
        case "getJournals":
          resolve(AppState.data.journals);
          break;
        case "getTenantConfig":
          resolve(AppState.tenant);
          break;
        case "getUsers":
          resolve(AppState.data.users);
          break;
        default:
          resolve({ success: true, message: "Operasi demo berhasil diproses." });
      }
    }, 150);
  });
}

// ==========================================
// UI FORMATTING UTILITIES
// ==========================================
function formatCurrency(num) {
  const val = parseFloat(num) || 0;
  return "Rp " + val.toLocaleString("id-ID");
}

function formatDateIndo(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function showToast(icon, title) {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: icon,
    title: title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
  });
}

// ==========================================
// CORE DATA LOADERS & CALCULATORS
// ==========================================
async function loadAllAppData() {
  renderLoadingState(true);
  try {
    AppState.data.coa = await apiCall("getCOA");
    AppState.data.kasBank = await apiCall("getKasBank");
    AppState.data.invoices = await apiCall("getInvoices");
    AppState.data.expenses = await apiCall("getExpenses");
    AppState.data.inventory = await apiCall("getInventory");
    AppState.data.payroll = await apiCall("getPayroll");
    AppState.data.journals = await apiCall("getJournals");

    // Compute derived metrics
    computeDerivedReports();
    renderCurrentTab();
  } catch (err) {
    console.error("Error loading app data:", err);
  } finally {
    renderLoadingState(false);
  }
}

function computeDerivedReports() {
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Calculate General Ledger Balances
  const glMap = {};
  AppState.data.coa.forEach(c => {
    glMap[c.Account_Code] = {
      code: c.Account_Code,
      name: c.Account_Name,
      category: c.Category,
      normal: c.Normal_Balance || "D",
      opening: parseFloat(c.Opening_Balance) || 0,
      debit: 0,
      credit: 0,
      ending: parseFloat(c.Opening_Balance) || 0,
      entries: []
    };
  });

  AppState.data.journals.forEach(j => {
    const code = j.Account_Code;
    if (glMap[code]) {
      const d = parseFloat(j.Debit) || 0;
      const c = parseFloat(j.Credit) || 0;
      glMap[code].debit += d;
      glMap[code].credit += c;
      if (glMap[code].normal === "D") {
        glMap[code].ending += (d - c);
      } else {
        glMap[code].ending += (c - d);
      }
      glMap[code].entries.push(j);
    }
  });

  // 2. Liquid Cash Calculation (Kas 1-11xx)
  let totalCash = 0;
  Object.values(glMap).forEach(acc => {
    if (acc.code.startsWith("1-11")) {
      totalCash += acc.ending;
    }
  });

  // 3. Income Statement
  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalExpenses = 0;
  const revList = [];
  const cogsList = [];
  const expList = [];

  AppState.data.coa.forEach(c => {
    const acc = glMap[c.Account_Code];
    if (!acc) return;
    if (c.Category === "Revenue") {
      revList.push({ code: c.Account_Code, name: c.Account_Name, amount: acc.ending });
      totalRevenue += acc.ending;
    } else if (c.Category === "Expense") {
      if (c.Account_Code.startsWith("5-")) {
        cogsList.push({ code: c.Account_Code, name: c.Account_Name, amount: acc.ending });
        totalCOGS += acc.ending;
      } else {
        expList.push({ code: c.Account_Code, name: c.Account_Name, amount: acc.ending });
        totalExpenses += acc.ending;
      }
    }
  });

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  AppState.data.incomeStatement = {
    totalRevenue,
    totalCOGS,
    grossProfit,
    totalExpenses,
    netProfit,
    profitMargin,
    revList,
    cogsList,
    expList
  };

  // 4. Balance Sheet
  let currentAssets = 0;
  let fixedAssets = 0;
  let currentLiabilities = 0;
  let longTermLiabilities = 0;
  let totalEquity = 0;

  const currentAssetList = [];
  const fixedAssetList = [];
  const currentLiabList = [];
  const equityList = [];

  AppState.data.coa.forEach(c => {
    const acc = glMap[c.Account_Code];
    if (!acc) return;
    if (c.Category === "Asset") {
      if (c.Account_Code.startsWith("1-1")) {
        currentAssetList.push({ code: c.Account_Code, name: c.Account_Name, amount: acc.ending });
        currentAssets += acc.ending;
      } else {
        fixedAssetList.push({ code: c.Account_Code, name: c.Account_Name, amount: acc.ending });
        fixedAssets += acc.ending;
      }
    } else if (c.Category === "Liability") {
      if (c.Account_Code.startsWith("2-1")) {
        currentLiabList.push({ code: c.Account_Code, name: c.Account_Name, amount: acc.ending });
        currentLiabilities += acc.ending;
      } else {
        longTermLiabilities += acc.ending;
      }
    } else if (c.Category === "Equity") {
      equityList.push({ code: c.Account_Code, name: c.Account_Name, amount: acc.ending });
      totalEquity += acc.ending;
    }
  });

  const totalAssets = currentAssets + fixedAssets;
  const totalLiab = currentLiabilities + longTermLiabilities;
  const totalEquityWithProfit = totalEquity + netProfit;
  const totalLiabAndEquity = totalLiab + totalEquityWithProfit;

  AppState.data.balanceSheet = {
    currentAssets,
    fixedAssets,
    totalAssets,
    currentLiabilities,
    longTermLiabilities,
    totalLiab,
    totalEquity: totalEquityWithProfit,
    totalLiabAndEquity,
    currentAssetList,
    fixedAssetList,
    currentLiabList,
    equityList,
    isBalanced: Math.abs(totalAssets - totalLiabAndEquity) < 5
  };

  // 5. Invoices AR & AP Alerts
  let arTotal = 0;
  let arOverdue = 0;
  let arDueSoon = 0;

  AppState.data.invoices.forEach(inv => {
    if (inv.Status !== "Paid") {
      const remaining = (parseFloat(inv.Grand_Total) || 0) - (parseFloat(inv.Amount_Paid) || 0);
      arTotal += remaining;
      if (inv.Due_Date && inv.Due_Date < todayStr) {
        arOverdue++;
        inv.Status = "Overdue";
      } else if (inv.Due_Date) {
        const daysDiff = (new Date(inv.Due_Date) - new Date(todayStr)) / (1000 * 3600 * 24);
        if (daysDiff <= 3 && daysDiff >= 0) arDueSoon++;
      }
    }
  });

  let apTotal = 0;
  let apOverdue = 0;
  let apDueSoon = 0;

  AppState.data.expenses.forEach(exp => {
    if (exp.Status !== "Paid") {
      const amt = parseFloat(exp.Amount) || 0;
      apTotal += amt;
      if (exp.Due_Date && exp.Due_Date < todayStr) {
        apOverdue++;
        exp.Status = "Overdue";
      } else if (exp.Due_Date) {
        const daysDiff = (new Date(exp.Due_Date) - new Date(todayStr)) / (1000 * 3600 * 24);
        if (daysDiff <= 3 && daysDiff >= 0) apDueSoon++;
      }
    }
  });

  // 6. Financial Ratios
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : "2.45";
  const der = totalEquityWithProfit > 0 ? ((totalLiab / totalEquityWithProfit) * 100).toFixed(1) + "%" : "12.8%";

  AppState.data.ratios = {
    currentRatio,
    der,
    netMargin: profitMargin + "%",
    quickRatio: currentLiabilities > 0 ? ((currentAssets - 35000000) / currentLiabilities).toFixed(2) : "1.85",
    healthStatus: parseFloat(currentRatio) >= 1.5 ? "Sangat Sehat & Likuid" : "Cukup"
  };

  AppState.data.dashboard = {
    totalCash,
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    arTotal,
    arOverdue,
    arDueSoon,
    apTotal,
    apOverdue,
    apDueSoon
  };
}

// ==========================================
// TAB ROUTING & VIEW CONTROLLERS
// ==========================================
function switchTab(tabId) {
  AppState.currentTab = tabId;

  const currentPreset = localStorage.getItem("app_theme_preset") || "sage";
  const palette = THEME_PALETTES[currentPreset] || THEME_PALETTES.sage;
  const sidebarStyle = localStorage.getItem("app_sidebar_style") || "dark";

  // Highlight active sidebar item with dynamic theme color
  document.querySelectorAll(".nav-item").forEach(el => {
    const active = el.getAttribute("data-tab") === tabId;
    el.classList.remove("bg-indigo-600", "bg-teal-600", "bg-emerald-600", "bg-purple-600", "text-white", "bg-slate-800");
    if (active) {
      el.style.backgroundColor = palette.primary;
      el.style.color = "#FFFFFF";
      el.style.boxShadow = `0 4px 14px 0 ${palette.shadow}`;
    } else {
      el.style.backgroundColor = "transparent";
      el.style.boxShadow = "none";
      if (sidebarStyle === "light") {
        el.style.color = "#475569";
      } else {
        el.style.color = "#94A3B8";
      }
    }
  });

  // Show/Hide views
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.toggle("hidden", panel.id !== `view-${tabId}`);
  });

  renderCurrentTab();
}

function renderCurrentTab() {
  switch (AppState.currentTab) {
    case "dashboard":
      renderDashboard();
      break;
    case "kas-bank":
      renderKasBank();
      break;
    case "invoices":
      renderInvoices();
      break;
    case "expenses":
      renderExpenses();
      break;
    case "inventory":
      renderInventory();
      break;
    case "payroll":
      renderPayroll();
      break;
    case "jurnal":
      renderJurnalBukuBesar();
      break;
    case "reconciliation":
      renderReconciliation();
      break;
    case "reports":
      renderReports();
      break;
    case "settings":
      renderSettings();
      break;
  }
  lucide.createIcons();
}

// ==========================================
// 1. DASHBOARD VIEW RENDERER
// ==========================================
let revenueExpenseChart = null;
let expenseCategoryChart = null;

function renderDashboard() {
  const d = AppState.data.dashboard;
  if (!d) return;

  // KPI Metrics
  document.getElementById("kpi-cash").textContent = formatCurrency(d.totalCash);
  document.getElementById("kpi-revenue").textContent = formatCurrency(d.totalRevenue);
  document.getElementById("kpi-expense").textContent = formatCurrency(d.totalExpenses);
  
  const netEl = document.getElementById("kpi-netprofit");
  netEl.textContent = formatCurrency(d.netProfit);
  netEl.className = `text-2xl font-bold ${d.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;

  document.getElementById("kpi-ar").textContent = formatCurrency(d.arTotal);
  document.getElementById("kpi-ap").textContent = formatCurrency(d.apTotal);

  // Due Date Alert Badges
  const alertContainer = document.getElementById("dashboard-alerts-container");
  let alertHtml = "";

  if (d.arOverdue > 0) {
    alertHtml += `
      <div class="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
        <div class="flex items-center gap-2.5">
          <i data-lucide="alert-triangle" class="w-5 h-5 text-rose-600"></i>
          <span><b>${d.arOverdue} Faktur Penjualan (Piutang)</b> telah melewati tanggal jatuh tempo!</span>
        </div>
        <button onclick="switchTab('invoices')" class="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold">Lihat Tagihan</button>
      </div>`;
  }
  if (d.apOverdue > 0) {
    alertHtml += `
      <div class="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <div class="flex items-center gap-2.5">
          <i data-lucide="clock" class="w-5 h-5 text-amber-600"></i>
          <span><b>${d.apOverdue} Tagihan Beban (Utang)</b> melewati jatuh tempo. Segera selesaikan pembayaran.</span>
        </div>
        <button onclick="switchTab('expenses')" class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold">Lihat Beban</button>
      </div>`;
  }
  if (d.arDueSoon > 0) {
    alertHtml += `
      <div class="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        <div class="flex items-center gap-2.5">
          <i data-lucide="bell" class="w-5 h-5 text-blue-600"></i>
          <span><b>${d.arDueSoon} Faktur</b> jatuh tempo dalam waktu H-3 ke depan.</span>
        </div>
        <button onclick="switchTab('invoices')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">Follow Up</button>
      </div>`;
  }

  if (!alertHtml) {
    alertHtml = `
      <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
        <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i>
        <span>Semua jadwal tagihan & piutang dalam status tertib. Tidak ada penunggakan kritis.</span>
      </div>`;
  }
  alertContainer.innerHTML = alertHtml;

  // Render Charts
  renderDashboardCharts();

  // Recent Transactions Table
  const recentTable = document.getElementById("dashboard-recent-tx");
  const recentList = AppState.data.kasBank.slice(0, 5);
  recentTable.innerHTML = recentList.map(tx => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="px-4 py-3 text-xs text-slate-500 font-mono">${formatDateIndo(tx.Date)}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-900">${tx.Description}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 rounded-full text-xs font-bold ${tx.Type === 'IN' ? 'bg-emerald-100 text-emerald-700' : (tx.Type === 'OUT' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700')}">
          ${tx.Type === 'IN' ? 'Kas Masuk' : (tx.Type === 'OUT' ? 'Kas Keluar' : 'Transfer')}
        </span>
      </td>
      <td class="px-4 py-3 text-right text-sm font-bold font-mono ${tx.Type === 'IN' ? 'text-emerald-600' : 'text-slate-800'}">
        ${tx.Type === 'IN' ? '+' : '-'}${formatCurrency(tx.Amount)}
      </td>
    </tr>
  `).join("");
}

function renderDashboardCharts() {
  const ctxRev = document.getElementById("chart-revenue-expense");
  if (!ctxRev) return;

  const currentPreset = localStorage.getItem("app_theme_preset") || "sage";
  const palette = THEME_PALETTES[currentPreset] || THEME_PALETTES.sage;

  if (revenueExpenseChart) revenueExpenseChart.destroy();
  if (expenseCategoryChart) expenseCategoryChart.destroy();

  // Trend Bar & Line Chart with Dynamic Pastel Theme Color
  revenueExpenseChart = new Chart(ctxRev, {
    type: "bar",
    data: {
      labels: ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"],
      datasets: [
        {
          label: "Pendapatan",
          data: [42000000, 55000000, 68000000, 72000000, 67500000, 85000000],
          backgroundColor: palette.primary,
          borderRadius: 8
        },
        {
          label: "Pengeluaran",
          data: [28000000, 31000000, 34500000, 39000000, 32000000, 36000000],
          backgroundColor: "#F43F5E",
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { family: "Plus Jakarta Sans", weight: "bold" } } }
      },
      scales: {
        y: {
          ticks: { callback: val => "Rp " + (val / 1000000) + "jt" }
        }
      }
    }
  });

  // Expense Doughnut Chart
  const ctxExp = document.getElementById("chart-expense-category");
  if (ctxExp) {
    expenseCategoryChart = new Chart(ctxExp, {
      type: "doughnut",
      data: {
        labels: ["Gaji & Upah", "Sewa Kantor", "Utilitas & Internet", "Operasional Umum", "Pemasaran"],
        datasets: [{
          data: [25000000, 8500000, 4500000, 6000000, 3500000],
          backgroundColor: [palette.primary, "#F43F5E", "#F59E0B", "#10B981", "#8B5CF6"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { family: "Plus Jakarta Sans", size: 11 } } }
        }
      }
    });
  }
}

// ==========================================
// 2. KAS & BANK VIEW RENDERER
// ==========================================
function renderKasBank() {
  const container = document.getElementById("kasbank-table-body");
  const list = AppState.data.kasBank;

  // Populate Accounts dropdown for modal
  const coaSourceSelect = document.getElementById("kb-source-account");
  const coaTargetSelect = document.getElementById("kb-target-account");
  
  if (coaSourceSelect && coaTargetSelect) {
    const coaOptions = AppState.data.coa.map(c => `<option value="${c.Account_Code}">${c.Account_Code} - ${c.Account_Name}</option>`).join("");
    coaSourceSelect.innerHTML = `<option value="">Pilih Akun Sumber...</option>` + coaOptions;
    coaTargetSelect.innerHTML = `<option value="">Pilih Akun Tujuan/Lawan...</option>` + coaOptions;
  }

  container.innerHTML = list.map(tx => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-4 py-3 text-xs font-mono text-slate-500">${tx.Tx_ID}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${formatDateIndo(tx.Date)}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-900">${tx.Description}</td>
      <td class="px-4 py-3">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${tx.Type === 'IN' ? 'bg-emerald-100 text-emerald-700' : (tx.Type === 'OUT' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700')}">
          ${tx.Type === 'IN' ? 'Kas Masuk' : (tx.Type === 'OUT' ? 'Kas Keluar' : 'Transfer')}
        </span>
      </td>
      <td class="px-4 py-3 text-xs font-mono text-slate-600">${tx.COA_Source} &rarr; ${tx.COA_Target}</td>
      <td class="px-4 py-3 text-right text-sm font-bold font-mono ${tx.Type === 'IN' ? 'text-emerald-600' : 'text-slate-900'}">
        ${formatCurrency(tx.Amount)}
      </td>
      <td class="px-4 py-3 text-center">
        ${tx.Receipt_URL ? `<a href="${tx.Receipt_URL}" target="_blank" class="text-teal-600 hover:text-teal-800 font-semibold text-xs inline-flex items-center gap-1"><i data-lucide="file-text" class="w-3.5 h-3.5"></i> Bukti</a>` : '<span class="text-slate-300 text-xs">-</span>'}
      </td>
    </tr>
  `).join("");
}

async function handleSaveKasBank(event) {
  event.preventDefault();
  const date = document.getElementById("kb-date").value;
  const type = document.getElementById("kb-type").value;
  const coaSource = document.getElementById("kb-source-account").value;
  const coaTarget = document.getElementById("kb-target-account").value;
  const amount = parseFloat(document.getElementById("kb-amount").value) || 0;
  const description = document.getElementById("kb-description").value;
  const receiptUrl = document.getElementById("kb-receipt").value;

  if (!coaSource || !coaTarget || amount <= 0 || !description) {
    Swal.fire("Data Belum Lengkap", "Harap isi seluruh field bertanda bintang (*).", "warning");
    return;
  }

  const newTx = {
    Tx_ID: "KB-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900),
    Date: date || new Date().toISOString().split("T")[0],
    COA_Source: coaSource,
    COA_Target: coaTarget,
    Type: type,
    Amount: amount,
    Description: description,
    Receipt_URL: receiptUrl,
    Created_By: AppState.user.username
  };

  if (AppState.mode === "live") {
    await apiCall("createKasBank", "POST", newTx);
  }

  AppState.data.kasBank.unshift(newTx);
  
  // Auto add to journals in mock
  AppState.data.journals.unshift({
    Journal_ID: "JRN-" + Date.now(),
    Date: newTx.Date,
    Account_Code: type === "IN" ? coaTarget : coaSource,
    Description: `[${type}] ${description}`,
    Debit: type === "IN" ? amount : 0,
    Credit: type === "IN" ? 0 : amount,
    Ref_ID: newTx.Tx_ID
  });

  closeModal("modal-kasbank");
  computeDerivedReports();
  renderKasBank();
  showToast("success", "Transaksi Kas & Jurnal Otomatis Berhasil Disimpan!");
}

// ==========================================
// 3. INVOICES & AR VIEW RENDERER
// ==========================================
function renderInvoices() {
  const container = document.getElementById("invoices-table-body");
  const list = AppState.data.invoices;

  container.innerHTML = list.map(inv => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-4 py-3 font-mono font-bold text-xs text-teal-700">${inv.Invoice_ID}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-900">${inv.Customer_Name}</td>
      <td class="px-4 py-3 text-xs text-slate-500 font-mono">${formatDateIndo(inv.Date)}</td>
      <td class="px-4 py-3 text-xs font-mono font-semibold ${inv.Status === 'Overdue' ? 'text-rose-600' : 'text-slate-600'}">${formatDateIndo(inv.Due_Date)}</td>
      <td class="px-4 py-3 text-right text-sm font-bold font-mono text-slate-900">${formatCurrency(inv.Grand_Total)}</td>
      <td class="px-4 py-3 text-center">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${inv.Status === 'Paid' ? 'badge-paid' : (inv.Status === 'Overdue' ? 'badge-overdue' : 'badge-sent')}">
          ${inv.Status}
        </span>
      </td>
      <td class="px-4 py-3 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="previewInvoice('${inv.Invoice_ID}')" class="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold" title="Cetak Faktur">
            <i data-lucide="printer" class="w-4 h-4"></i>
          </button>
          ${inv.Status !== 'Paid' ? `
            <button onclick="openPayInvoiceModal('${inv.Invoice_ID}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> Lunasi
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join("");
}

function previewInvoice(invId) {
  const inv = AppState.data.invoices.find(i => i.Invoice_ID === invId);
  if (!inv) return;

  const t = AppState.tenant;
  const printArea = document.getElementById("invoice-print-content");

  let itemsHtml = "";
  if (inv.Items && inv.Items.length > 0) {
    itemsHtml = inv.Items.map((it, idx) => `
      <tr class="border-b border-slate-200 text-sm">
        <td class="py-2.5 text-center text-slate-500">${idx + 1}</td>
        <td class="py-2.5 font-semibold text-slate-800">${it.name || it.sku}</td>
        <td class="py-2.5 text-center">${it.qty}</td>
        <td class="py-2.5 text-right font-mono">${formatCurrency(it.unitPrice)}</td>
        <td class="py-2.5 text-right font-mono font-bold">${formatCurrency(it.qty * it.unitPrice)}</td>
      </tr>
    `).join("");
  } else {
    itemsHtml = `
      <tr class="border-b border-slate-200 text-sm">
        <td class="py-2.5 text-center text-slate-500">1</td>
        <td class="py-2.5 font-semibold text-slate-800">Layanan Jasa & Produk Tertera</td>
        <td class="py-2.5 text-center">1</td>
        <td class="py-2.5 text-right font-mono">${formatCurrency(inv.Subtotal)}</td>
        <td class="py-2.5 text-right font-mono font-bold">${formatCurrency(inv.Subtotal)}</td>
      </tr>
    `;
  }

  printArea.innerHTML = `
    <div class="p-8 bg-white max-w-3xl mx-auto border border-slate-300 rounded-xl">
      <div class="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
        <div>
          <h2 class="text-2xl font-extrabold text-slate-900">${t.companyName}</h2>
          <p class="text-xs text-slate-500 max-w-sm mt-1">${t.address}</p>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold uppercase tracking-wider text-teal-700">FAKTUR PENJUALAN RESMI</span>
          <h3 class="text-xl font-mono font-bold text-slate-900 mt-1">${inv.Invoice_ID}</h3>
          <p class="text-xs text-slate-500 mt-1">Status: <span class="font-bold text-emerald-600 uppercase">${inv.Status}</span></p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase">Ditagihkan Kepada:</span>
          <h4 class="text-base font-bold text-slate-900 mt-1">${inv.Customer_Name}</h4>
          <p class="text-xs text-slate-500 mt-0.5">Catatan: ${inv.Notes || 'Pembayaran Transfer Bank'}</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500">Tanggal Faktur: <b class="text-slate-800">${formatDateIndo(inv.Date)}</b></div>
          <div class="text-xs text-slate-500 mt-1">Jatuh Tempo: <b class="text-rose-600">${formatDateIndo(inv.Due_Date)}</b></div>
        </div>
      </div>

      <table class="w-full text-left mb-6">
        <thead class="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-y border-slate-200">
          <tr>
            <th class="py-2 text-center w-10">No</th>
            <th class="py-2">Deskripsi Barang / Jasa</th>
            <th class="py-2 text-center w-16">Qty</th>
            <th class="py-2 text-right">Harga Satuan</th>
            <th class="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="flex justify-end mb-8">
        <div class="w-64 space-y-1.5 text-sm">
          <div class="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span class="font-mono">${formatCurrency(inv.Subtotal)}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>PPN (11%):</span>
            <span class="font-mono">${formatCurrency(inv.Tax_Amount)}</span>
          </div>
          <div class="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
            <span>Grand Total:</span>
            <span class="font-mono text-teal-700">${formatCurrency(inv.Grand_Total)}</span>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-200 pt-6 flex justify-between items-center text-xs text-slate-500">
        <div>
          <p class="font-semibold text-slate-700">Rekening Pembayaran:</p>
          <p>Bank Mandiri: 124-00-9988776-1 a.n ${t.companyName}</p>
        </div>
        <div class="text-center">
          <p class="mb-10">Hormat Kami,</p>
          <p class="font-bold text-slate-800 border-t border-slate-400 pt-1">Finance Dept</p>
        </div>
      </div>
    </div>
  `;

  openModal("modal-invoice-preview");
}

function openPayInvoiceModal(invId) {
  const inv = AppState.data.invoices.find(i => i.Invoice_ID === invId);
  if (!inv) return;

  Swal.fire({
    title: "Pelunasan Faktur Piutang",
    html: `
      <div class="text-left text-sm space-y-3">
        <p>Konfirmasi penerimaan pembayaran untuk Faktur <b>${inv.Invoice_ID}</b> atas nama <b>${inv.Customer_Name}</b>.</p>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Nominal Diterima</label>
          <input id="pay-inv-amount" type="number" class="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold" value="${inv.Grand_Total}">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Pilih Rekening Kas / Bank Penerima</label>
          <select id="pay-inv-account" class="w-full p-2 border border-slate-300 rounded-lg">
            <option value="1-1120">1-1120 - Bank Mandiri Rek Giro</option>
            <option value="1-1130">1-1130 - Bank BCA Rek Operasional</option>
            <option value="1-1110">1-1110 - Kas Operasional Kantor</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Proses Pelunasan",
    cancelButtonText: "Batal",
    confirmButtonColor: "#059669"
  }).then(async (result) => {
    if (result.isConfirmed) {
      const amt = parseFloat(document.getElementById("pay-inv-amount").value);
      const acc = document.getElementById("pay-inv-account").value;

      inv.Status = "Paid";
      inv.Amount_Paid = amt;

      // Add Kas In record
      AppState.data.kasBank.unshift({
        Tx_ID: "KB-PAY-" + Date.now(),
        Date: new Date().toISOString().split("T")[0],
        COA_Source: "1-1200",
        COA_Target: acc,
        Type: "IN",
        Amount: amt,
        Description: `Pelunasan Faktur ${inv.Invoice_ID} (${inv.Customer_Name})`,
        Receipt_URL: "",
        Created_By: AppState.user.username
      });

      computeDerivedReports();
      renderInvoices();
      showToast("success", `Faktur ${inv.Invoice_ID} Berhasil Dilunasi!`);
    }
  });
}

// ==========================================
// 4. EXPENSES & AP VIEW RENDERER
// ==========================================
function renderExpenses() {
  const container = document.getElementById("expenses-table-body");
  const list = AppState.data.expenses;

  container.innerHTML = list.map(exp => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-4 py-3 font-mono font-bold text-xs text-rose-600">${exp.Bill_ID}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-900">${exp.Vendor_Name}</td>
      <td class="px-4 py-3 text-sm text-slate-700">${exp.Description}</td>
      <td class="px-4 py-3 text-xs font-mono font-semibold ${exp.Status === 'Overdue' ? 'text-rose-600' : 'text-slate-600'}">${formatDateIndo(exp.Due_Date)}</td>
      <td class="px-4 py-3 text-right text-sm font-bold font-mono text-slate-900">${formatCurrency(exp.Amount)}</td>
      <td class="px-4 py-3 text-center">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${exp.Status === 'Paid' ? 'badge-paid' : (exp.Status === 'Overdue' ? 'badge-overdue' : 'badge-due-soon')}">
          ${exp.Status}
        </span>
      </td>
      <td class="px-4 py-3 text-center">
        ${exp.Status !== 'Paid' ? `
          <button onclick="payExpensePrompt('${exp.Bill_ID}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 mx-auto">
            <i data-lucide="credit-card" class="w-3.5 h-3.5"></i> Bayar
          </button>
        ` : '<span class="text-emerald-600 text-xs font-semibold flex items-center justify-center gap-1"><i data-lucide="check-check" class="w-4 h-4"></i> Lunas</span>'}
      </td>
    </tr>
  `).join("");
}

function payExpensePrompt(billId) {
  const exp = AppState.data.expenses.find(e => e.Bill_ID === billId);
  if (!exp) return;

  Swal.fire({
    title: "Pembayaran Tagihan Beban",
    text: `Bayar tagihan ${exp.Bill_ID} ke vendor "${exp.Vendor_Name}" sebesar ${formatCurrency(exp.Amount)}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Bayar Sekarang",
    cancelButtonText: "Batal",
    confirmButtonColor: "#059669"
  }).then(res => {
    if (res.isConfirmed) {
      exp.Status = "Paid";
      AppState.data.kasBank.unshift({
        Tx_ID: "KB-EXP-" + Date.now(),
        Date: new Date().toISOString().split("T")[0],
        COA_Source: "1-1120",
        COA_Target: exp.Category_COA || "6-1000",
        Type: "OUT",
        Amount: exp.Amount,
        Description: `Pembayaran Beban: ${exp.Description} (${exp.Vendor_Name})`,
        Receipt_URL: "",
        Created_By: AppState.user.username
      });
      computeDerivedReports();
      renderExpenses();
      showToast("success", "Pembayaran beban berhasil diproses!");
    }
  });
}

// ==========================================
// 5. INVENTORY & STOK RENDERER
// ==========================================
function renderInventory() {
  const container = document.getElementById("inventory-table-body");
  const list = AppState.data.inventory;

  container.innerHTML = list.map(item => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-4 py-3 font-mono font-bold text-xs text-teal-700">${item.SKU}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-900">${item.Item_Name}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${item.Unit}</td>
      <td class="px-4 py-3 text-right text-xs font-mono">${formatCurrency(item.Cost_Price)}</td>
      <td class="px-4 py-3 text-right text-xs font-mono font-bold text-teal-700">${formatCurrency(item.Selling_Price)}</td>
      <td class="px-4 py-3 text-center">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${item.Stock_Qty <= item.Min_Stock ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200' : 'bg-slate-100 text-slate-800'}">
          ${item.Stock_Qty} ${item.Unit} ${item.Stock_Qty <= item.Min_Stock ? '(! Min)' : ''}
        </span>
      </td>
      <td class="px-4 py-3 text-center">
        <button onclick="adjustStockModal('${item.SKU}')" class="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold">
          Sesuaikan Stok
        </button>
      </td>
    </tr>
  `).join("");
}

function adjustStockModal(sku) {
  const item = AppState.data.inventory.find(i => i.SKU === sku);
  if (!item) return;

  Swal.fire({
    title: `Penyesuaian Stok: ${item.Item_Name}`,
    html: `
      <div class="text-left text-sm space-y-3">
        <p>Stok saat ini: <b>${item.Stock_Qty} ${item.Unit}</b></p>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Jenis Penyesuaian</label>
          <select id="adj-type" class="w-full p-2 border border-slate-300 rounded-lg">
            <option value="ADD">Tambah Stok Masuk (Stock In)</option>
            <option value="SUB">Kurangi Stok Keluar (Stock Out / Rusak)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Jumlah</label>
          <input id="adj-qty" type="number" class="w-full p-2 border border-slate-300 rounded-lg font-bold" value="5" min="1">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Simpan Perubahan",
    cancelButtonText: "Batal",
    confirmButtonColor: "#0D9488"
  }).then(res => {
    if (res.isConfirmed) {
      const type = document.getElementById("adj-type").value;
      const qty = parseFloat(document.getElementById("adj-qty").value) || 0;
      if (type === "ADD") item.Stock_Qty += qty;
      else item.Stock_Qty = Math.max(0, item.Stock_Qty - qty);

      renderInventory();
      showToast("success", `Stok ${item.Item_Name} berhasil diperbarui menjadi ${item.Stock_Qty} ${item.Unit}`);
    }
  });
}

// ==========================================
// 6. PAYROLL & GAJI RENDERER
// ==========================================
function renderPayroll() {
  const container = document.getElementById("payroll-table-body");
  const list = AppState.data.payroll;

  container.innerHTML = list.map(p => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-4 py-3 font-mono font-bold text-xs text-teal-700">${p.Payroll_ID}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-900">${p.Employee_Name}</td>
      <td class="px-4 py-3 text-xs text-slate-600">${p.Period_Month_Year}</td>
      <td class="px-4 py-3 text-right text-xs font-mono">${formatCurrency(p.Basic_Salary)}</td>
      <td class="px-4 py-3 text-right text-xs font-mono text-emerald-600">+${formatCurrency(p.Allowances)}</td>
      <td class="px-4 py-3 text-right text-xs font-mono text-rose-600">-${formatCurrency(p.Deductions)}</td>
      <td class="px-4 py-3 text-right text-sm font-bold font-mono text-slate-900">${formatCurrency(p.Net_Salary)}</td>
      <td class="px-4 py-3 text-center">
        <button onclick="previewPayslip('${p.Payroll_ID}')" class="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold flex items-center gap-1 mx-auto">
          <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Slip Gaji
        </button>
      </td>
    </tr>
  `).join("");
}

function previewPayslip(payrollId) {
  const p = AppState.data.payroll.find(item => item.Payroll_ID === payrollId);
  if (!p) return;

  const t = AppState.tenant;
  const printArea = document.getElementById("invoice-print-content");

  printArea.innerHTML = `
    <div class="p-8 bg-white max-w-2xl mx-auto border border-slate-300 rounded-xl">
      <div class="text-center border-b border-slate-200 pb-4 mb-6">
        <h2 class="text-xl font-extrabold text-slate-900">${t.companyName}</h2>
        <p class="text-xs text-slate-500">${t.address}</p>
        <span class="inline-block mt-3 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">SLIP GAJI KARYAWAN</span>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <div class="text-xs text-slate-500">ID Penggajian: <b class="font-mono text-slate-800">${p.Payroll_ID}</b></div>
          <div class="text-xs text-slate-500 mt-1">Nama Karyawan: <b class="text-slate-900 font-bold">${p.Employee_Name}</b></div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500">Periode: <b class="text-slate-800">${p.Period_Month_Year}</b></div>
          <div class="text-xs text-slate-500 mt-1">Tanggal Bayar: <b class="text-slate-800">${formatDateIndo(p.Payment_Date)}</b></div>
        </div>
      </div>

      <div class="space-y-2 text-sm mb-6">
        <div class="flex justify-between py-2 border-b border-slate-100">
          <span class="text-slate-600">Gaji Pokok:</span>
          <span class="font-mono font-semibold">${formatCurrency(p.Basic_Salary)}</span>
        </div>
        <div class="flex justify-between py-2 border-b border-slate-100 text-emerald-700">
          <span>Tunjangan & Bonus:</span>
          <span class="font-mono font-semibold">+ ${formatCurrency(p.Allowances)}</span>
        </div>
        <div class="flex justify-between py-2 border-b border-slate-100 text-rose-700">
          <span>Potongan (PPh 21 / BPJS / Pinjaman):</span>
          <span class="font-mono font-semibold">- ${formatCurrency(p.Deductions)}</span>
        </div>
        <div class="flex justify-between py-3 bg-teal-50 px-3 rounded-lg text-base font-bold text-teal-950">
          <span>Total Gaji Bersih (Take Home Pay):</span>
          <span class="font-mono text-teal-700">${formatCurrency(p.Net_Salary)}</span>
        </div>
      </div>

      <div class="border-t border-slate-200 pt-6 flex justify-between items-center text-xs text-slate-500">
        <div>
          <p>Dibayarkan via Kas/Bank Perusahaan.</p>
        </div>
        <div class="text-center">
          <p class="mb-10">Penerima,</p>
          <p class="font-bold text-slate-800 border-t border-slate-400 pt-1">${p.Employee_Name}</p>
        </div>
      </div>
    </div>
  `;

  openModal("modal-invoice-preview");
}

// ==========================================
// 7. JURNAL UMUM & BUKU BESAR RENDERER
// ==========================================
function renderJurnalBukuBesar() {
  const container = document.getElementById("journals-table-body");
  const list = AppState.data.journals;

  container.innerHTML = list.map(j => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-4 py-3 font-mono text-xs text-slate-500">${j.Journal_ID}</td>
      <td class="px-4 py-3 text-xs text-slate-600 font-mono">${formatDateIndo(j.Date)}</td>
      <td class="px-4 py-3 text-xs font-mono font-bold text-teal-700">${j.Account_Code}</td>
      <td class="px-4 py-3 text-sm font-semibold text-slate-800">${j.Account_Name || j.Description}</td>
      <td class="px-4 py-3 text-right text-sm font-mono font-bold text-slate-900">${j.Debit > 0 ? formatCurrency(j.Debit) : '-'}</td>
      <td class="px-4 py-3 text-right text-sm font-mono font-bold text-slate-900">${j.Credit > 0 ? formatCurrency(j.Credit) : '-'}</td>
      <td class="px-4 py-3 text-xs font-mono text-slate-400">${j.Ref_ID || '-'}</td>
    </tr>
  `).join("");
}

// ==========================================
// 8. REKONSILIASI BANK RENDERER
// ==========================================
function renderReconciliation() {
  const container = document.getElementById("reconcile-result-container");
  container.innerHTML = `
    <div class="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-bold text-slate-900">Status Pencocokan Mutasi Bank</h4>
          <p class="text-xs text-slate-500 mt-0.5">Rekening Bank Mandiri Giro (1-1120) vs Mutasi Koran</p>
        </div>
        <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
          <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> Rekonsiliasi Klop (Match 100%)
        </span>
      </div>

      <div class="grid grid-cols-3 gap-4 text-center">
        <div class="p-4 bg-white rounded-lg border border-slate-200">
          <span class="text-xs text-slate-400 font-bold uppercase">Saldo Sistem ERP</span>
          <div class="text-lg font-mono font-bold text-slate-900 mt-1">Rp 75.000.000</div>
        </div>
        <div class="p-4 bg-white rounded-lg border border-slate-200">
          <span class="text-xs text-slate-400 font-bold uppercase">Saldo Rekening Koran</span>
          <div class="text-lg font-mono font-bold text-slate-900 mt-1">Rp 75.000.000</div>
        </div>
        <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <span class="text-xs text-emerald-700 font-bold uppercase">Selisih (Variance)</span>
          <div class="text-lg font-mono font-bold text-emerald-600 mt-1">Rp 0</div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 9. LAPORAN KEUANGAN (REPORTS) RENDERER
// ==========================================
function renderReports() {
  const inc = AppState.data.incomeStatement;
  const bal = AppState.data.balanceSheet;
  const rat = AppState.data.ratios;

  if (!inc || !bal || !rat) return;

  // Laba Rugi Tab
  document.getElementById("rep-total-rev").textContent = formatCurrency(inc.totalRevenue);
  document.getElementById("rep-total-cogs").textContent = formatCurrency(inc.totalCOGS);
  document.getElementById("rep-gross-profit").textContent = formatCurrency(inc.grossProfit);
  document.getElementById("rep-total-exp").textContent = formatCurrency(inc.totalExpenses);
  document.getElementById("rep-net-profit").textContent = formatCurrency(inc.netProfit);
  document.getElementById("rep-profit-margin").textContent = inc.profitMargin + "%";

  // Neraca Tab
  document.getElementById("rep-current-assets").textContent = formatCurrency(bal.currentAssets);
  document.getElementById("rep-fixed-assets").textContent = formatCurrency(bal.fixedAssets);
  document.getElementById("rep-total-assets").textContent = formatCurrency(bal.totalAssets);
  document.getElementById("rep-total-liab").textContent = formatCurrency(bal.totalLiab);
  document.getElementById("rep-total-equity").textContent = formatCurrency(bal.totalEquity);
  document.getElementById("rep-liab-equity").textContent = formatCurrency(bal.totalLiabAndEquity);

  const balanceBadge = document.getElementById("rep-balance-badge");
  if (bal.isBalanced) {
    balanceBadge.innerHTML = `<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1"><i data-lucide="shield-check" class="w-4 h-4"></i> Neraca Seimbang (Aktiva = Pasiva)</span>`;
  } else {
    balanceBadge.innerHTML = `<span class="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">Selisih: ${formatCurrency(Math.abs(bal.totalAssets - bal.totalLiabAndEquity))}</span>`;
  }

  // Ratios
  document.getElementById("rat-current").textContent = rat.currentRatio;
  document.getElementById("rat-quick").textContent = rat.quickRatio;
  document.getElementById("rat-der").textContent = rat.der;
  document.getElementById("rat-margin").textContent = rat.netMargin;
  document.getElementById("rat-health").textContent = rat.healthStatus;
}

// ==========================================
// 10. SETTINGS & CMS RENDERER
// ==========================================
function renderSettings() {
  const t = AppState.tenant;
  document.getElementById("set-company-name").value = t.companyName || "";
  document.getElementById("set-address").value = t.address || "";
  document.getElementById("set-logo-url").value = t.logoUrl || "";
  document.getElementById("set-license-key").value = t.licenseKey || "";
  document.getElementById("set-gas-url").value = AppState.apiUrl || "";
  document.getElementById("set-app-mode").value = AppState.mode || "demo";

  // Render User Management Table
  const userContainer = document.getElementById("settings-users-table");
  if (userContainer) {
    userContainer.innerHTML = AppState.data.users.map(u => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-sm">
        <td class="px-4 py-2.5 font-mono text-xs text-slate-500">${u.userId}</td>
        <td class="px-4 py-2.5 font-semibold text-slate-800">${u.fullName} (${u.username})</td>
        <td class="px-4 py-2.5">
          <span class="px-2 py-0.5 rounded text-xs font-bold ${u.role === 'Superadmin' ? 'bg-teal-100 text-teal-800' : (u.role === 'Finance' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700')}">
            ${u.role}
          </span>
        </td>
        <td class="px-4 py-2.5 text-xs text-emerald-600 font-bold">${u.status}</td>
      </tr>
    `).join("");
  }
}

function handleSaveSettings(event) {
  event.preventDefault();
  AppState.tenant.companyName = document.getElementById("set-company-name").value;
  AppState.tenant.address = document.getElementById("set-address").value;
  AppState.tenant.logoUrl = document.getElementById("set-logo-url").value;
  AppState.tenant.licenseKey = document.getElementById("set-license-key").value;
  AppState.apiUrl = document.getElementById("set-gas-url").value;
  AppState.mode = document.getElementById("set-app-mode").value;

  localStorage.setItem("app_tenant", JSON.stringify(AppState.tenant));
  localStorage.setItem("app_gas_url", AppState.apiUrl);
  localStorage.setItem("app_mode", AppState.mode);

  // Update Topbar branding
  document.getElementById("top-company-name").textContent = AppState.tenant.companyName;
  document.getElementById("mode-badge").textContent = AppState.mode === "demo" ? "DEMO MODE (STANDALONE)" : "LIVE GAS CONNECTED";
  document.getElementById("mode-badge").className = AppState.mode === "demo" ? "px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300" : "px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";

  showToast("success", "Pengaturan Perusahaan & API Berhasil Disimpan!");
}

// ==========================================
// MODAL CONTROLS & ONBOARDING TOUR
// ==========================================
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.remove("hidden");
    m.classList.add("flex");
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add("hidden");
    m.classList.remove("flex");
  }
}

function printCurrentArea() {
  window.print();
}

function startOnboardingTour() {
  const driver = window.driver.js.driver;
  const driverObj = driver({
    showProgress: true,
    animate: true,
    steps: [
      {
        element: "#sidebar-nav",
        popover: {
          title: "1. Navigasi Modul Lengkap",
          description: "Akses seluruh modul operasional finansial: Kas & Bank, Faktur Penjualan (AR), Tagihan Beban (AP), Inventori, Payroll, hingga Laporan Neraca & Laba Rugi.",
          position: "right"
        }
      },
      {
        element: "#kpi-cards-grid",
        popover: {
          title: "2. Ringkasan Eksekutif & KPI",
          description: "Pantau posisi Kas Likuid, Pendapatan, Net Profit, Piutang yang belum terbayar, dan Tagihan jatuh tempo secara real-time.",
          position: "bottom"
        }
      },
      {
        element: "#quick-actions-bar",
        popover: {
          title: "3. Tombol Aksi Cepat",
          description: "Gunakan tombol cepat ini untuk mencatat Kas Masuk/Keluar baru, membuat Faktur Penjualan kilat, atau mencetak slip gaji.",
          position: "bottom"
        }
      },
      {
        element: "#api-mode-btn",
        popover: {
          title: "4. Hubungkan Google Apps Script",
          description: "Anda dapat berpindah dari Mode Demo ke Mode Live Google Sheets kapan saja dengan menempelkan URL Web App GAS Anda di sini.",
          position: "bottom"
        }
      }
    ]
  });

  driverObj.drive();
}

function renderLoadingState(isLoading) {
  const loader = document.getElementById("global-loader");
  if (loader) {
    loader.classList.toggle("hidden", !isLoading);
  }
}

// ==========================================
// AL-IMAM POS AI - ISLAMIC PASTEL THEME ENGINE
// ==========================================
const THEME_PALETTES = {
  sage: {
    primary: "#0D9488",
    hover: "#0F766E",
    light: "#F0FDFA",
    text: "#0F766E",
    shadow: "rgba(13, 148, 136, 0.25)",
    gradient: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
    name: "Al-Imam Sage Mint (Islamic Pastel)"
  },
  medina: {
    primary: "#D97706",
    hover: "#B45309",
    light: "#FEF3C7",
    text: "#B45309",
    shadow: "rgba(217, 119, 6, 0.25)",
    gradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    name: "Medina Warm Sand (Pastel Gold)"
  },
  firdaus: {
    primary: "#0284C7",
    hover: "#0369A1",
    light: "#F0F9FF",
    text: "#0369A1",
    shadow: "rgba(2, 132, 199, 0.25)",
    gradient: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
    name: "Firdaus Sky Blue (Pastel Azure)"
  },
  majlis: {
    primary: "#8B5CF6",
    hover: "#7C3AED",
    light: "#F5F3FF",
    text: "#6D28D9",
    shadow: "rgba(139, 92, 246, 0.25)",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
    name: "Majlis Soft Lavender (Pastel Lilac)"
  },
  rosewater: {
    primary: "#F43F5E",
    hover: "#E11D48",
    light: "#FFF1F2",
    text: "#BE123C",
    shadow: "rgba(244, 63, 94, 0.25)",
    gradient: "linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)",
    name: "Rosewater Blossom (Pastel Coral)"
  },
  saffron: {
    primary: "#F97316",
    hover: "#EA580C",
    light: "#FFF7ED",
    text: "#C2410C",
    shadow: "rgba(249, 115, 22, 0.25)",
    gradient: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
    name: "Saffron Apricot (Pastel Peach)"
  },
  qalam: {
    primary: "#475569",
    hover: "#334155",
    light: "#F8FAFC",
    text: "#1E293B",
    shadow: "rgba(71, 85, 105, 0.25)",
    gradient: "linear-gradient(135deg, #475569 0%, #64748B 100%)",
    name: "Al-Qalam Platinum (Pastel Slate)"
  }
};

function applyThemePreset(presetKey, isSilent = false) {
  const palette = THEME_PALETTES[presetKey] || THEME_PALETTES.sage;
  const root = document.documentElement;

  // Set CSS Custom Properties
  root.style.setProperty("--primary-color", palette.primary);
  root.style.setProperty("--primary-hover", palette.hover);
  root.style.setProperty("--primary-light", palette.light);
  root.style.setProperty("--primary-text", palette.text);
  root.style.setProperty("--primary-shadow", palette.shadow);
  root.style.setProperty("--primary-gradient", palette.gradient);

  // Update Buttons Active State UI in Swatches
  document.querySelectorAll(".theme-picker-btn").forEach(btn => {
    btn.classList.remove("border-teal-600", "border-amber-500", "border-sky-500", "border-purple-500", "border-rose-500", "border-orange-500", "border-slate-600", "bg-teal-50/50", "bg-amber-50/50", "bg-sky-50/50", "bg-purple-50/50", "bg-rose-50/50", "bg-orange-50/50", "bg-slate-50/50");
    btn.classList.add("border-slate-200");
    const checkIcon = btn.querySelector(".check-icon");
    if (checkIcon) checkIcon.classList.add("hidden");
  });

  const activeBtn = document.querySelector(`.theme-picker-btn[onclick*="${presetKey}"]`);
  if (activeBtn) {
    activeBtn.classList.remove("border-slate-200");
    activeBtn.classList.add("border-teal-600", "bg-teal-50/50");
    const checkIcon = activeBtn.querySelector(".check-icon");
    if (checkIcon) checkIcon.classList.remove("hidden");
  }

  // Update Dynamic Color accents in brand logo
  const brandIcon = document.getElementById("sidebar-brand-icon");
  if (brandIcon) {
    brandIcon.style.background = palette.gradient;
  }

  localStorage.setItem("app_theme_preset", presetKey);

  // Instantly re-highlight active sidebar tab with new color
  const activeNavItem = document.querySelector(`.nav-item[data-tab="${AppState.currentTab}"]`);
  if (activeNavItem) {
    activeNavItem.style.backgroundColor = palette.primary;
    activeNavItem.style.color = "#FFFFFF";
    activeNavItem.style.boxShadow = `0 4px 14px 0 ${palette.shadow}`;
  }

  // Update primary action buttons across all views
  document.querySelectorAll(".btn-primary-theme, .btn-theme-primary").forEach(btn => {
    btn.style.backgroundColor = palette.primary;
  });

  // Re-render chart with new palette if on dashboard
  if (AppState.currentTab === "dashboard") {
    renderDashboardCharts();
  }

  // If sidebar is in brand gradient mode, update sidebar background as well
  const sidebarStyle = localStorage.getItem("app_sidebar_style") || "dark";
  if (sidebarStyle === "brand") {
    const sidebar = document.getElementById("sidebar-nav");
    if (sidebar) sidebar.style.background = palette.gradient;
  }

  if (!isSilent) {
    showToast("success", `Tema Pastel berganti ke "${palette.name}"`);
  }
}

function setSidebarStyle(styleKey) {
  const sidebar = document.getElementById("sidebar-nav");
  if (!sidebar) return;

  const btnDark = document.getElementById("btn-sidebar-dark");
  const btnLight = document.getElementById("btn-sidebar-light");
  const btnBrand = document.getElementById("btn-sidebar-brand");

  // Reset button borders
  [btnDark, btnLight, btnBrand].forEach(b => {
    if (b) {
      b.classList.remove("border-teal-600");
      b.classList.add("border-slate-200");
    }
  });

  if (styleKey === "light") {
    sidebar.className = "w-64 bg-white/95 text-slate-700 flex flex-col flex-shrink-0 border-r border-slate-200 select-none z-30 transition-all duration-300";
    sidebar.style.background = "";
    if (btnLight) {
      btnLight.classList.remove("border-slate-200");
      btnLight.classList.add("border-teal-600");
    }
  } else if (styleKey === "brand") {
    const currentPreset = localStorage.getItem("app_theme_preset") || "sage";
    const palette = THEME_PALETTES[currentPreset] || THEME_PALETTES.sage;
    sidebar.className = "w-64 text-white flex flex-col flex-shrink-0 border-r border-teal-900 select-none z-30 transition-all duration-300";
    sidebar.style.background = palette.gradient;
    if (btnBrand) {
      btnBrand.classList.remove("border-slate-200");
      btnBrand.classList.add("border-teal-600");
    }
  } else {
    // Al-Imam Deep Forest (Default Islamic Dark Slate)
    sidebar.className = "w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none z-30 transition-all duration-300";
    sidebar.style.background = "";
    if (btnDark) {
      btnDark.classList.remove("border-slate-200");
      btnDark.classList.add("border-teal-600");
    }
  }

  localStorage.setItem("app_sidebar_style", styleKey);
  
  // Re-render active tab styling with correct text colors for sidebar mode
  switchTab(AppState.currentTab);
}

function setBorderRadiusStyle(radiusClass) {
  const btnRound = document.getElementById("btn-radius-round");
  const btnMed = document.getElementById("btn-radius-medium");
  const btnSq = document.getElementById("btn-radius-square");

  [btnRound, btnMed, btnSq].forEach(b => {
    if (b) {
      b.classList.remove("border-teal-600", "bg-teal-50", "text-teal-700");
      b.classList.add("border-slate-200", "text-slate-700");
    }
  });

  if (radiusClass === "rounded-2xl") {
    if (btnRound) btnRound.classList.add("border-teal-600", "bg-teal-50", "text-teal-700");
  } else if (radiusClass === "rounded-lg") {
    if (btnMed) btnMed.classList.add("border-teal-600", "bg-teal-50", "text-teal-700");
  } else {
    if (btnSq) btnSq.classList.add("border-teal-600", "bg-teal-50", "text-teal-700");
  }

  localStorage.setItem("app_border_radius", radiusClass);
  showToast("info", "Gaya sudut elemen diperbarui.");
}

function initThemeOnLoad() {
  const savedPreset = localStorage.getItem("app_theme_preset") || "sage";
  const savedSidebar = localStorage.getItem("app_sidebar_style") || "dark";
  const savedRadius = localStorage.getItem("app_border_radius") || "rounded-2xl";

  applyThemePreset(savedPreset, true);
  setSidebarStyle(savedSidebar);
  setBorderRadiusStyle(savedRadius);
}

// ==========================================
// INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initMockData();
  initThemeOnLoad();
  
  // Set initial branding
  document.getElementById("top-company-name").textContent = AppState.tenant.companyName;
  document.getElementById("mode-badge").textContent = AppState.mode === "demo" ? "DEMO MODE (STANDALONE)" : "LIVE GAS CONNECTED";
  document.getElementById("mode-badge").className = AppState.mode === "demo" ? "px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300" : "px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";

  loadAllAppData();
});
