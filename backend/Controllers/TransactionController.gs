/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Controllers/TransactionController.gs - Core Financial Modules & CRUD
 * ============================================================================
 */

const TransactionController = {
  // ==========================================
  // CHART OF ACCOUNTS (COA)
  // ==========================================
  getCOA: function() {
    const list = SheetModel.getAll(CONFIG.SHEETS.COA);
    list.sort((a, b) => String(a.Account_Code).localeCompare(String(b.Account_Code)));
    return list;
  },

  createCOA: function(params) {
    const { accountCode, accountName, category, subCategory, normalBalance, openingBalance } = params;
    if (!accountCode || !accountName || !category) {
      throw new Error("Kode Akun, Nama Akun, dan Kategori wajib diisi.");
    }

    const existing = SheetModel.findByField(CONFIG.SHEETS.COA, "Account_Code", accountCode);
    if (existing) {
      throw new Error(`Kode akun ${accountCode} sudah terdaftar.`);
    }

    const newCOA = {
      Account_Code: accountCode,
      Account_Name: accountName,
      Category: category,
      Sub_Category: subCategory || "",
      Normal_Balance: normalBalance || (["Asset", "Expense"].includes(category) ? "D" : "K"),
      Opening_Balance: parseFloat(openingBalance) || 0,
      Current_Balance: parseFloat(openingBalance) || 0,
      Is_Active: "TRUE"
    };

    SheetModel.insert(CONFIG.SHEETS.COA, newCOA);
    return { success: true, message: "Akun COA berhasil ditambahkan.", data: newCOA };
  },

  // ==========================================
  // KAS & BANK
  // ==========================================
  getKasBank: function(filterType, filterAccount) {
    let list = SheetModel.getAll(CONFIG.SHEETS.KAS_BANK);
    list.sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0));

    if (filterType) {
      list = list.filter(item => item.Type === filterType);
    }
    if (filterAccount) {
      list = list.filter(item => item.COA_Source === filterAccount || item.COA_Target === filterAccount);
    }
    return list;
  },

  createKasBank: function(params, userPayload) {
    const { date, coaSource, coaTarget, type, amount, description, receiptUrl } = params;
    if (!coaSource || !coaTarget || !type || !amount) {
      throw new Error("Akun Sumber, Akun Tujuan, Jenis, dan Nominal wajib diisi.");
    }

    const txId = "KB-" + Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyyMMdd-HHmmss") + "-" + Math.floor(100 + Math.random() * 900);
    const now = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");

    const record = {
      Tx_ID: txId,
      Date: date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd"),
      COA_Source: coaSource,
      COA_Target: coaTarget,
      Type: type, // IN, OUT, TRANSFER
      Amount: parseFloat(amount) || 0,
      Description: description || "Transaksi Kas/Bank",
      Receipt_URL: receiptUrl || "",
      Created_By: userPayload.username || "System",
      Created_At: now
    };

    SheetModel.insert(CONFIG.SHEETS.KAS_BANK, record);

    // Auto-Post into Jurnal Umum
    const journalId = AccountingService.postKasBankJournal(record, userPayload.username);

    return { success: true, message: "Transaksi Kas/Bank berhasil disimpan & dijurnal otomatis.", txId, journalId };
  },

  // ==========================================
  // INVOICES & PIUTANG (AR)
  // ==========================================
  getInvoices: function(statusFilter) {
    let list = SheetModel.getAll(CONFIG.SHEETS.INVOICES_AR);
    list.sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0));

    const todayStr = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");

    // Dynamic status check for overdue
    list.forEach(inv => {
      if (inv.Status !== "Paid" && inv.Due_Date && inv.Due_Date < todayStr) {
        inv.Status = "Overdue";
      }
      try {
        if (typeof inv.Items_JSON === "string" && inv.Items_JSON.startsWith("[")) {
          inv.Items = JSON.parse(inv.Items_JSON);
        }
      } catch (e) {
        inv.Items = [];
      }
    });

    if (statusFilter) {
      list = list.filter(item => item.Status === statusFilter);
    }
    return list;
  },

  createInvoice: function(params, userPayload) {
    const { date, dueDate, customerName, items, taxAmount, notes } = params;
    if (!customerName || !items || items.length === 0) {
      throw new Error("Nama Pelanggan dan Daftar Item Faktur wajib diisi.");
    }

    let subtotal = 0;
    items.forEach(it => {
      const lineTotal = (parseFloat(it.qty) || 1) * (parseFloat(it.unitPrice) || 0);
      subtotal += lineTotal;
    });

    const tax = parseFloat(taxAmount) || 0;
    const grandTotal = subtotal + tax;

    const invoiceId = "INV-" + Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
    const now = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");

    const record = {
      Invoice_ID: invoiceId,
      Date: date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd"),
      Due_Date: dueDate || "",
      Customer_Name: customerName,
      Items_JSON: JSON.stringify(items),
      Subtotal: subtotal,
      Tax_Amount: tax,
      Grand_Total: grandTotal,
      Amount_Paid: 0,
      Status: "Sent",
      Notes: notes || "",
      Created_At: now
    };

    SheetModel.insert(CONFIG.SHEETS.INVOICES_AR, record);

    // Auto-Post into Jurnal Umum
    AccountingService.postInvoiceARJournal(record, userPayload.username);

    // Update Inventory stock qty if SKU is present
    items.forEach(it => {
      if (it.sku) {
        try {
          const invItem = SheetModel.findByField(CONFIG.SHEETS.INVENTORY, "SKU", it.sku);
          if (invItem) {
            const currentStock = parseFloat(invItem.Stock_Qty) || 0;
            const newStock = Math.max(0, currentStock - (parseFloat(it.qty) || 1));
            SheetModel.updateByField(CONFIG.SHEETS.INVENTORY, "SKU", it.sku, {
              Stock_Qty: newStock,
              Updated_At: now
            });
          }
        } catch (e) {
          // Log stock error safely
        }
      }
    });

    return { success: true, message: "Faktur penjualan berhasil diterbitkan & stok disesuaikan.", invoiceId };
  },

  payInvoice: function(params, userPayload) {
    const { invoiceId, paymentDate, coaKasBank, amountPaid } = params;
    const invoice = SheetModel.findByField(CONFIG.SHEETS.INVOICES_AR, "Invoice_ID", invoiceId);
    if (!invoice) throw new Error("Faktur tidak ditemukan.");

    const payAmt = parseFloat(amountPaid) || parseFloat(invoice.Grand_Total);
    const dateStr = paymentDate || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");

    // Update Invoice Status
    SheetModel.updateByField(CONFIG.SHEETS.INVOICES_AR, "Invoice_ID", invoiceId, {
      Amount_Paid: payAmt,
      Status: "Paid"
    });

    // Create Kas In record & Journal (Debit Kas, Kredit Piutang Usaha 1-1200)
    const txId = "KB-PAY-" + Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyyMMdd-HHmmss");
    const kasRecord = {
      Tx_ID: txId,
      Date: dateStr,
      COA_Source: "1-1200", // Piutang Usaha
      COA_Target: coaKasBank || "1-1110", // Kas / Bank Penerima
      Type: "IN",
      Amount: payAmt,
      Description: `Pelunasan Faktur ${invoiceId} (${invoice.Customer_Name})`,
      Receipt_URL: "",
      Created_By: userPayload.username,
      Created_At: Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss")
    };
    SheetModel.insert(CONFIG.SHEETS.KAS_BANK, kasRecord);

    AccountingService.postJournalEntries([
      { Date: dateStr, Account_Code: coaKasBank || "1-1110", Description: `Pelunasan Faktur ${invoiceId}`, Debit: payAmt, Credit: 0 },
      { Date: dateStr, Account_Code: "1-1200", Description: `Pelunasan Piutang Faktur ${invoiceId}`, Debit: 0, Credit: payAmt }
    ], invoiceId, "Invoices_AR", userPayload.username);

    return { success: true, message: `Faktur ${invoiceId} berhasil dilunasi.` };
  },

  // ==========================================
  // EXPENSES & UTANG (AP)
  // ==========================================
  getExpenses: function(statusFilter) {
    let list = SheetModel.getAll(CONFIG.SHEETS.EXPENSES_AP);
    list.sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0));

    const todayStr = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");
    list.forEach(exp => {
      if (exp.Status !== "Paid" && exp.Due_Date && exp.Due_Date < todayStr) {
        exp.Status = "Overdue";
      }
    });

    if (statusFilter) {
      list = list.filter(item => item.Status === statusFilter);
    }
    return list;
  },

  createExpense: function(params, userPayload) {
    const { date, dueDate, vendorName, categoryCOA, description, amount, isPaidNow, paymentCOA, receiptUrl } = params;
    if (!vendorName || !categoryCOA || !amount) {
      throw new Error("Nama Vendor, Kategori Beban, dan Nominal wajib diisi.");
    }

    const billId = "EXP-" + Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
    const now = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");

    const record = {
      Bill_ID: billId,
      Date: date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd"),
      Due_Date: dueDate || "",
      Vendor_Name: vendorName,
      Category_COA: categoryCOA,
      Description: description || "Pengeluaran Operasional",
      Amount: parseFloat(amount) || 0,
      Status: isPaidNow ? "Paid" : "Unpaid",
      Receipt_URL: receiptUrl || "",
      Payment_Date: isPaidNow ? (date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd")) : "",
      Payment_COA: isPaidNow ? (paymentCOA || "1-1110") : "",
      Created_At: now
    };

    SheetModel.insert(CONFIG.SHEETS.EXPENSES_AP, record);

    // Auto-Post Jurnal Umum
    AccountingService.postExpenseAPJournal(record, userPayload.username);

    // If paid immediately, record Kas Out
    if (isPaidNow) {
      SheetModel.insert(CONFIG.SHEETS.KAS_BANK, {
        Tx_ID: "KB-EXP-" + Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyyMMdd-HHmmss"),
        Date: record.Date,
        COA_Source: paymentCOA || "1-1110",
        COA_Target: categoryCOA,
        Type: "OUT",
        Amount: record.Amount,
        Description: `Beban Langsung: ${record.Description} (${record.Vendor_Name})`,
        Receipt_URL: record.Receipt_URL,
        Created_By: userPayload.username,
        Created_At: now
      });
    }

    return { success: true, message: "Tagihan beban berhasil dicatat & diposting ke jurnal.", billId };
  },

  payExpense: function(params, userPayload) {
    const { billId, paymentDate, coaKasBank } = params;
    const bill = SheetModel.findByField(CONFIG.SHEETS.EXPENSES_AP, "Bill_ID", billId);
    if (!bill) throw new Error("Tagihan beban tidak ditemukan.");

    const payDate = paymentDate || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const amount = parseFloat(bill.Amount) || 0;

    SheetModel.updateByField(CONFIG.SHEETS.EXPENSES_AP, "Bill_ID", billId, {
      Status: "Paid",
      Payment_Date: payDate,
      Payment_COA: coaKasBank || "1-1110"
    });

    // Create Kas Out record & Journal (Debit Utang Usaha 2-1100, Kredit Kas/Bank)
    SheetModel.insert(CONFIG.SHEETS.KAS_BANK, {
      Tx_ID: "KB-EXP-" + Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyyMMdd-HHmmss"),
      Date: payDate,
      COA_Source: coaKasBank || "1-1110",
      COA_Target: "2-1100", // Utang Usaha
      Type: "OUT",
      Amount: amount,
      Description: `Pembayaran Utang Beban ${billId} (${bill.Vendor_Name})`,
      Receipt_URL: bill.Receipt_URL,
      Created_By: userPayload.username,
      Created_At: Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss")
    });

    AccountingService.postJournalEntries([
      { Date: payDate, Account_Code: "2-1100", Description: `Pelunasan Utang Beban ${billId}`, Debit: amount, Credit: 0 },
      { Date: payDate, Account_Code: coaKasBank || "1-1110", Description: `Pembayaran Utang ${billId}`, Debit: 0, Credit: amount }
    ], billId, "Expenses_AP", userPayload.username);

    return { success: true, message: `Tagihan ${billId} berhasil dilunasi.` };
  },

  // ==========================================
  // INVENTORY & STOCK
  // ==========================================
  getInventory: function() {
    return SheetModel.getAll(CONFIG.SHEETS.INVENTORY);
  },

  createInventoryItem: function(params) {
    const { sku, itemName, unit, costPrice, sellingPrice, stockQty, minStock, coaAsset, coaCOGS } = params;
    if (!sku || !itemName) throw new Error("SKU dan Nama Barang wajib diisi.");

    const existing = SheetModel.findByField(CONFIG.SHEETS.INVENTORY, "SKU", sku);
    if (existing) throw new Error(`SKU ${sku} sudah terdaftar.`);

    const now = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");

    const record = {
      SKU: sku,
      Item_Name: itemName,
      Unit: unit || "Pcs",
      Cost_Price: parseFloat(costPrice) || 0,
      Selling_Price: parseFloat(sellingPrice) || 0,
      Stock_Qty: parseFloat(stockQty) || 0,
      Min_Stock: parseFloat(minStock) || 5,
      COA_Asset: coaAsset || "1-1300", // Persediaan Barang Dagang
      COA_COGS: coaCOGS || "5-1000",   // HPP
      Updated_At: now
    };

    SheetModel.insert(CONFIG.SHEETS.INVENTORY, record);
    return { success: true, message: "Item barang berhasil ditambahkan.", data: record };
  },

  adjustStock: function(params) {
    const { sku, adjustmentQty, type, notes } = params; // type: 'ADD' or 'SUBTRACT'
    const item = SheetModel.findByField(CONFIG.SHEETS.INVENTORY, "SKU", sku);
    if (!item) throw new Error(`Item ${sku} tidak ditemukan.`);

    const current = parseFloat(item.Stock_Qty) || 0;
    const adj = parseFloat(adjustmentQty) || 0;
    const newQty = type === "ADD" ? (current + adj) : Math.max(0, current - adj);

    SheetModel.updateByField(CONFIG.SHEETS.INVENTORY, "SKU", sku, {
      Stock_Qty: newQty,
      Updated_At: Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss")
    });

    return { success: true, message: `Stok ${item.Item_Name} berhasil disesuaikan menjadi ${newQty} ${item.Unit}.`, newQty };
  },

  // ==========================================
  // PAYROLL & GAJI KARYAWAN
  // ==========================================
  getPayroll: function(periodFilter) {
    let list = SheetModel.getAll(CONFIG.SHEETS.PAYROLL);
    list.sort((a, b) => new Date(b.Payment_Date || 0) - new Date(a.Payment_Date || 0));
    if (periodFilter) {
      list = list.filter(item => item.Period_Month_Year === periodFilter);
    }
    return list;
  },

  createPayroll: function(params, userPayload) {
    const { period, employeeId, employeeName, basicSalary, allowances, deductions, paymentDate, coaKas } = params;
    if (!employeeName || !basicSalary || !period) {
      throw new Error("Periode, Nama Karyawan, dan Gaji Pokok wajib diisi.");
    }

    const basic = parseFloat(basicSalary) || 0;
    const allow = parseFloat(allowances) || 0;
    const ded = parseFloat(deductions) || 0;
    const net = basic + allow - ded;

    const payrollId = "PAY-" + Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyyMM") + "-" + Math.floor(1000 + Math.random() * 9000);

    const record = {
      Payroll_ID: payrollId,
      Period_Month_Year: period,
      Employee_ID: employeeId || "EMP-" + Math.floor(100 + Math.random() * 900),
      Employee_Name: employeeName,
      Basic_Salary: basic,
      Allowances: allow,
      Deductions: ded,
      Net_Salary: net,
      Payment_Date: paymentDate || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd"),
      Status: "Paid",
      COA_Expense: "6-1100", // Beban Gaji
      COA_Kas: coaKas || "1-1110" // Kas / Bank
    };

    SheetModel.insert(CONFIG.SHEETS.PAYROLL, record);

    // Auto-Post Jurnal Umum
    AccountingService.postPayrollJournal(record, userPayload.username);

    // Record Kas Out
    SheetModel.insert(CONFIG.SHEETS.KAS_BANK, {
      Tx_ID: "KB-" + payrollId,
      Date: record.Payment_Date,
      COA_Source: record.COA_Kas,
      COA_Target: "6-1100",
      Type: "OUT",
      Amount: record.Net_Salary,
      Description: `Gaji Karyawan: ${record.Employee_Name} (${record.Period_Month_Year})`,
      Receipt_URL: "",
      Created_By: userPayload.username,
      Created_At: Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss")
    });

    return { success: true, message: "Slip gaji diterbitkan & jurnal beban gaji berhasil diposting.", payrollId };
  },

  // ==========================================
  // JURNAL UMUM MANUAL
  // ==========================================
  getJournals: function(limit) {
    const list = SheetModel.getAll(CONFIG.SHEETS.JURNAL_UMUM);
    list.sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0));
    return limit ? list.slice(0, limit) : list;
  },

  createManualJournal: function(params, userPayload) {
    const { entries, description } = params;
    if (!entries || entries.length < 2) {
      throw new Error("Jurnal manual memerlukan minimal 2 baris transaksi.");
    }
    const journalId = AccountingService.postJournalEntries(entries, "MANUAL-" + Date.now(), "MANUAL", userPayload.username);
    return { success: true, message: "Jurnal umum manual berhasil disimpan.", journalId };
  },

  // ==========================================
  // BANK RECONCILIATION HELPER
  // ==========================================
  reconcileBankTransactions: function(params) {
    const { bankCOA, statementRows } = params; // statementRows: [{ date: '2026-09-01', description: '', amount: 500000, type: 'CR'/'DB' }]
    const systemKas = SheetModel.getAll(CONFIG.SHEETS.KAS_BANK).filter(k => k.COA_Source === bankCOA || k.COA_Target === bankCOA);

    const matched = [];
    const unmatchedSystem = [];
    const unmatchedStatement = [...statementRows];

    systemKas.forEach(sys => {
      const matchIdx = unmatchedStatement.findIndex(st => {
        const dateMatch = Math.abs(new Date(st.date) - new Date(sys.Date)) <= (2 * 86400000); // 2 days tolerance
        const amtMatch = Math.abs(parseFloat(st.amount) - parseFloat(sys.Amount)) < 1;
        return dateMatch && amtMatch;
      });

      if (matchIdx !== -1) {
        matched.push({
          system: sys,
          statement: unmatchedStatement[matchIdx],
          status: "MATCHED"
        });
        unmatchedStatement.splice(matchIdx, 1);
      } else {
        unmatchedSystem.push(sys);
      }
    });

    return {
      totalSystemTx: systemKas.length,
      totalStatementTx: statementRows.length,
      matchedCount: matched.length,
      unmatchedSystemCount: unmatchedSystem.length,
      unmatchedStatementCount: unmatchedStatement.length,
      matchedList: matched,
      unmatchedSystemList: unmatchedSystem,
      unmatchedStatementList: unmatchedStatement
    };
  }
};
