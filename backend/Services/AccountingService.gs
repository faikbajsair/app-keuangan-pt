/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Services/AccountingService.gs - Double-Entry Engine & Financial Calculations
 * ============================================================================
 */

const AccountingService = {
  /**
   * Validate that Total Debit strictly equals Total Credit (Double-Entry Invariant)
   */
  validateJournalBalance: function(entries) {
    if (!entries || entries.length < 2) {
      throw new Error("Jurnal harus memiliki minimal 2 baris (Debit dan Kredit).");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(entry => {
      const debit = parseFloat(entry.Debit) || 0;
      const credit = parseFloat(entry.Credit) || 0;
      totalDebit += debit;
      totalCredit += credit;
    });

    // Handle floating point imprecision
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Jurnal tidak seimbang (Unbalanced Journal)! Total Debit: Rp ${totalDebit.toLocaleString()}, Total Kredit: Rp ${totalCredit.toLocaleString()}`);
    }

    if (totalDebit === 0) {
      throw new Error("Nominal jurnal tidak boleh bernilai nol.");
    }

    return true;
  },

  /**
   * Post multiple journal entries to Jurnal_Umum atomically
   */
  postJournalEntries: function(entries, refId, moduleName, user) {
    this.validateJournalBalance(entries);

    const now = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    const journalId = "JRN-" + Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyyMMdd-HHmmss") + "-" + Math.floor(100 + Math.random() * 900);

    const coaList = SheetModel.getAll(CONFIG.SHEETS.COA);
    const coaMap = {};
    coaList.forEach(c => {
      coaMap[c.Account_Code] = c.Account_Name;
    });

    const rowsToInsert = entries.map(item => ({
      Journal_ID: journalId,
      Date: item.Date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd"),
      Account_Code: item.Account_Code,
      Account_Name: item.Account_Name || coaMap[item.Account_Code] || "Akun " + item.Account_Code,
      Description: item.Description || "Auto-Journal " + moduleName,
      Debit: parseFloat(item.Debit) || 0,
      Credit: parseFloat(item.Credit) || 0,
      Ref_ID: refId || journalId,
      Module: moduleName || "MANUAL",
      Created_By: user || "System",
      Created_At: now
    }));

    SheetModel.insertBatch(CONFIG.SHEETS.JURNAL_UMUM, rowsToInsert);
    return journalId;
  },

  /**
   * Auto-Post Kas/Bank Transaction into Jurnal Umum
   */
  postKasBankJournal: function(kasTx, user) {
    const amount = parseFloat(kasTx.Amount) || 0;
    if (amount <= 0) throw new Error("Nominal Kas/Bank harus lebih dari 0.");

    const entries = [];
    const dateStr = kasTx.Date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");

    if (kasTx.Type === "IN") {
      // Kas Masuk: Debit Kas/Bank, Kredit Lawan Akun (e.g. Pendapatan / Piutang)
      entries.push({
        Date: dateStr,
        Account_Code: kasTx.COA_Target, // Akun Kas/Bank penampung
        Description: `[Kas Masuk] ${kasTx.Description}`,
        Debit: amount,
        Credit: 0
      });
      entries.push({
        Date: dateStr,
        Account_Code: kasTx.COA_Source, // Akun Pendapatan/Lawan
        Description: `[Kas Masuk] ${kasTx.Description}`,
        Debit: 0,
        Credit: amount
      });
    } else if (kasTx.Type === "OUT") {
      // Kas Keluar: Debit Lawan Akun (Beban/Utang), Kredit Kas/Bank
      entries.push({
        Date: dateStr,
        Account_Code: kasTx.COA_Target, // Akun Beban/Lawan
        Description: `[Kas Keluar] ${kasTx.Description}`,
        Debit: amount,
        Credit: 0
      });
      entries.push({
        Date: dateStr,
        Account_Code: kasTx.COA_Source, // Akun Kas/Bank asal
        Description: `[Kas Keluar] ${kasTx.Description}`,
        Debit: 0,
        Credit: amount
      });
    } else if (kasTx.Type === "TRANSFER") {
      // Transfer Antar Bank: Debit Bank Tujuan, Kredit Bank Asal
      entries.push({
        Date: dateStr,
        Account_Code: kasTx.COA_Target,
        Description: `[Transfer Masuk] ${kasTx.Description}`,
        Debit: amount,
        Credit: 0
      });
      entries.push({
        Date: dateStr,
        Account_Code: kasTx.COA_Source,
        Description: `[Transfer Keluar] ${kasTx.Description}`,
        Debit: 0,
        Credit: amount
      });
    }

    return this.postJournalEntries(entries, kasTx.Tx_ID, "KasBank", user);
  },

  /**
   * Auto-Post Invoice (AR) into Jurnal Umum (Sales on Credit / Cash)
   */
  postInvoiceARJournal: function(invoice, user) {
    const subtotal = parseFloat(invoice.Subtotal) || 0;
    const tax = parseFloat(invoice.Tax_Amount) || 0;
    const grandTotal = parseFloat(invoice.Grand_Total) || (subtotal + tax);
    const dateStr = invoice.Date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");

    const entries = [
      // Debit: Piutang Usaha (AR) - 1-1200
      {
        Date: dateStr,
        Account_Code: "1-1200",
        Description: `Faktur Piutang ${invoice.Invoice_ID} - ${invoice.Customer_Name}`,
        Debit: grandTotal,
        Credit: 0
      },
      // Kredit: Pendapatan Penjualan - 4-1000
      {
        Date: dateStr,
        Account_Code: "4-1000",
        Description: `Penjualan atas Faktur ${invoice.Invoice_ID}`,
        Debit: 0,
        Credit: subtotal
      }
    ];

    // Jika ada PPN Keluaran - 2-1300
    if (tax > 0) {
      entries.push({
        Date: dateStr,
        Account_Code: "2-1300",
        Description: `PPN Keluaran Faktur ${invoice.Invoice_ID}`,
        Debit: 0,
        Credit: tax
      });
    }

    return this.postJournalEntries(entries, invoice.Invoice_ID, "Invoices_AR", user);
  },

  /**
   * Auto-Post Expense / Bill (AP) into Jurnal Umum
   */
  postExpenseAPJournal: function(expense, user) {
    const amount = parseFloat(expense.Amount) || 0;
    const dateStr = expense.Date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const expenseCOA = expense.Category_COA || "6-1000"; // Default Beban Operasional Umum

    const entries = [
      // Debit: Akun Beban terkait
      {
        Date: dateStr,
        Account_Code: expenseCOA,
        Description: `Beban: ${expense.Description} (${expense.Vendor_Name})`,
        Debit: amount,
        Credit: 0
      },
      // Kredit: Utang Usaha (2-1100) jika status Unpaid, atau Kas jika langsung lunas
      {
        Date: dateStr,
        Account_Code: expense.Status === "Paid" ? (expense.Payment_COA || "1-1110") : "2-1100",
        Description: `Utang/Pembayaran Beban ${expense.Bill_ID} - ${expense.Vendor_Name}`,
        Debit: 0,
        Credit: amount
      }
    ];

    return this.postJournalEntries(entries, expense.Bill_ID, "Expenses_AP", user);
  },

  /**
   * Auto-Post Payroll into Jurnal Umum
   */
  postPayrollJournal: function(payroll, user) {
    const basic = parseFloat(payroll.Basic_Salary) || 0;
    const allowances = parseFloat(payroll.Allowances) || 0;
    const deductions = parseFloat(payroll.Deductions) || 0;
    const netSalary = parseFloat(payroll.Net_Salary) || (basic + allowances - deductions);
    const dateStr = payroll.Payment_Date || Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");

    const entries = [
      // Debit: Beban Gaji & Upah (6-1100)
      {
        Date: dateStr,
        Account_Code: "6-1100",
        Description: `Beban Gaji Karyawan ${payroll.Employee_Name} (${payroll.Period_Month_Year})`,
        Debit: basic + allowances,
        Credit: 0
      },
      // Kredit: Kas/Bank (1-1110)
      {
        Date: dateStr,
        Account_Code: payroll.COA_Kas || "1-1110",
        Description: `Pembayaran Gaji Net ${payroll.Employee_Name}`,
        Debit: 0,
        Credit: netSalary
      }
    ];

    // Jika ada potongan (e.g. Utang Karyawan / PPh 21 / Potongan Asuransi) - Kredit Akun Kewajiban/Potongan
    if (deductions > 0) {
      entries.push({
        Date: dateStr,
        Account_Code: "2-1400", // Utang Gaji & Potongan Lainnya
        Description: `Potongan Gaji ${payroll.Employee_Name}`,
        Debit: 0,
        Credit: deductions
      });
    }

    return this.postJournalEntries(entries, payroll.Payroll_ID, "Payroll", user);
  },

  /**
   * Calculate General Ledger (Buku Besar) with running balances
   */
  getGeneralLedger: function(filterCOA, startDate, endDate) {
    const coaList = SheetModel.getAll(CONFIG.SHEETS.COA);
    const journals = SheetModel.getAll(CONFIG.SHEETS.JURNAL_UMUM);

    const coaMap = {};
    coaList.forEach(c => {
      coaMap[c.Account_Code] = {
        name: c.Account_Name,
        category: c.Category,
        normalBalance: c.Normal_Balance || "D",
        openingBalance: parseFloat(c.Opening_Balance) || 0,
        transactions: [],
        totalDebit: 0,
        totalCredit: 0,
        endingBalance: parseFloat(c.Opening_Balance) || 0
      };
    });

    journals.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    journals.forEach(j => {
      const code = String(j.Account_Code).trim();
      const jDate = j.Date ? j.Date.split('T')[0] : "";

      if (startDate && jDate < startDate) return;
      if (endDate && jDate > endDate) return;

      if (!coaMap[code]) {
        coaMap[code] = {
          name: j.Account_Name || code,
          category: "Other",
          normalBalance: "D",
          openingBalance: 0,
          transactions: [],
          totalDebit: 0,
          totalCredit: 0,
          endingBalance: 0
        };
      }

      const acc = coaMap[code];
      const debit = parseFloat(j.Debit) || 0;
      const credit = parseFloat(j.Credit) || 0;

      acc.totalDebit += debit;
      acc.totalCredit += credit;

      if (acc.normalBalance === "D") {
        acc.endingBalance += (debit - credit);
      } else {
        acc.endingBalance += (credit - debit);
      }

      acc.transactions.push({
        Journal_ID: j.Journal_ID,
        Date: jDate,
        Description: j.Description,
        Ref_ID: j.Ref_ID,
        Debit: debit,
        Credit: credit,
        RunningBalance: acc.endingBalance
      });
    });

    if (filterCOA) {
      return { [filterCOA]: coaMap[filterCOA] || null };
    }

    return coaMap;
  },

  /**
   * Generate Financial Statements: Laba Rugi (Income Statement)
   */
  getIncomeStatement: function(startDate, endDate) {
    const gl = this.getGeneralLedger(null, startDate, endDate);
    const coaList = SheetModel.getAll(CONFIG.SHEETS.COA);

    let revenues = [];
    let cogs = [];
    let expenses = [];

    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalExpense = 0;

    coaList.forEach(c => {
      const code = c.Account_Code;
      const ledger = gl[code];
      const balance = ledger ? ledger.endingBalance : 0;

      if (c.Category === CONFIG.ACCOUNT_CATEGORIES.REVENUE) {
        revenues.push({ code, name: c.Account_Name, amount: balance });
        totalRevenue += balance;
      } else if (c.Category === CONFIG.ACCOUNT_CATEGORIES.EXPENSE) {
        if (code.startsWith("5-")) {
          cogs.push({ code, name: c.Account_Name, amount: balance });
          totalCOGS += balance;
        } else {
          expenses.push({ code, name: c.Account_Name, amount: balance });
          totalExpense += balance;
        }
      }
    });

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpense;

    return {
      period: { startDate: startDate || "Semua", endDate: endDate || "Hari ini" },
      revenues,
      totalRevenue,
      cogs,
      totalCOGS,
      grossProfit,
      expenses,
      totalExpense,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
    };
  },

  /**
   * Generate Balance Sheet (Laporan Neraca)
   */
  getBalanceSheet: function(asOfDate) {
    const gl = this.getGeneralLedger(null, null, asOfDate);
    const coaList = SheetModel.getAll(CONFIG.SHEETS.COA);
    const incomeStmt = this.getIncomeStatement(null, asOfDate);

    let currentAssets = [];
    let fixedAssets = [];
    let currentLiabilities = [];
    let longTermLiabilities = [];
    let equityList = [];

    let totalCurrentAssets = 0;
    let totalFixedAssets = 0;
    let totalCurrentLiabilities = 0;
    let totalLongTermLiabilities = 0;
    let totalEquity = 0;

    coaList.forEach(c => {
      const code = c.Account_Code;
      const ledger = gl[code];
      const balance = ledger ? ledger.endingBalance : 0;

      if (c.Category === CONFIG.ACCOUNT_CATEGORIES.ASSET) {
        if (code.startsWith("1-1")) {
          currentAssets.push({ code, name: c.Account_Name, amount: balance });
          totalCurrentAssets += balance;
        } else {
          fixedAssets.push({ code, name: c.Account_Name, amount: balance });
          totalFixedAssets += balance;
        }
      } else if (c.Category === CONFIG.ACCOUNT_CATEGORIES.LIABILITY) {
        if (code.startsWith("2-1")) {
          currentLiabilities.push({ code, name: c.Account_Name, amount: balance });
          totalCurrentLiabilities += balance;
        } else {
          longTermLiabilities.push({ code, name: c.Account_Name, amount: balance });
          totalLongTermLiabilities += balance;
        }
      } else if (c.Category === CONFIG.ACCOUNT_CATEGORIES.EQUITY) {
        equityList.push({ code, name: c.Account_Name, amount: balance });
        totalEquity += balance;
      }
    });

    // Tambahkan Laba Tahun Berjalan ke Ekuitas
    const retainedEarnings = incomeStmt.netProfit;
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    const totalAssets = totalCurrentAssets + totalFixedAssets;
    const totalEquityWithProfit = totalEquity + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithProfit;

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

    return {
      asOfDate: asOfDate || "Hari Ini",
      assets: {
        current: currentAssets,
        totalCurrent: totalCurrentAssets,
        fixed: fixedAssets,
        totalFixed: totalFixedAssets,
        grandTotal: totalAssets
      },
      liabilities: {
        current: currentLiabilities,
        totalCurrent: totalCurrentLiabilities,
        longTerm: longTermLiabilities,
        totalLongTerm: totalLongTermLiabilities,
        grandTotal: totalLiabilities
      },
      equity: {
        accounts: equityList,
        retainedEarnings: retainedEarnings,
        grandTotal: totalEquityWithProfit
      },
      totalLiabilitiesAndEquity: totalLiabilitiesAndEquity,
      isBalanced: isBalanced,
      variance: totalAssets - totalLiabilitiesAndEquity
    };
  },

  /**
   * Generate Cash Flow Statement (Laporan Arus Kas)
   */
  getCashFlowStatement: function(startDate, endDate) {
    const kasData = SheetModel.getAll(CONFIG.SHEETS.KAS_BANK);
    
    let operatingIn = 0;
    let operatingOut = 0;
    let investingIn = 0;
    let investingOut = 0;
    let financingIn = 0;
    let financingOut = 0;

    kasData.forEach(tx => {
      const txDate = tx.Date ? tx.Date.split('T')[0] : "";
      if (startDate && txDate < startDate) return;
      if (endDate && txDate > endDate) return;

      const amt = parseFloat(tx.Amount) || 0;
      const targetCOA = String(tx.COA_Target || tx.COA_Source || "");

      if (tx.Type === "IN") {
        if (targetCOA.startsWith("4-") || targetCOA.startsWith("1-1200")) {
          operatingIn += amt;
        } else if (targetCOA.startsWith("1-2")) {
          investingIn += amt; // Penjualan aset tetap
        } else if (targetCOA.startsWith("3-") || targetCOA.startsWith("2-2")) {
          financingIn += amt; // Tambahan modal / pinjaman bank
        } else {
          operatingIn += amt;
        }
      } else if (tx.Type === "OUT") {
        if (targetCOA.startsWith("5-") || targetCOA.startsWith("6-") || targetCOA.startsWith("2-1100")) {
          operatingOut += amt;
        } else if (targetCOA.startsWith("1-2")) {
          investingOut += amt; // Pembelian aset tetap
        } else if (targetCOA.startsWith("3-") || targetCOA.startsWith("2-2")) {
          financingOut += amt; // Prive / Bayar pokok utang bank
        } else {
          operatingOut += amt;
        }
      }
    });

    const netOperating = operatingIn - operatingOut;
    const netInvesting = investingIn - investingOut;
    const netFinancing = financingIn - financingOut;
    const netCashChange = netOperating + netInvesting + netFinancing;

    return {
      period: { startDate: startDate || "Awal", endDate: endDate || "Akhir" },
      operating: { cashIn: operatingIn, cashOut: operatingOut, net: netOperating },
      investing: { cashIn: investingIn, cashOut: investingOut, net: netInvesting },
      financing: { cashIn: financingIn, cashOut: financingOut, net: netFinancing },
      netCashChange: netCashChange
    };
  },

  /**
   * Compute Key Financial Ratios & Health Indicators
   */
  getFinancialRatios: function() {
    const balanceSheet = this.getBalanceSheet();
    const incomeStmt = this.getIncomeStatement();

    const currentAssets = balanceSheet.assets.totalCurrent;
    const currentLiabilities = balanceSheet.liabilities.totalCurrent;
    const totalAssets = balanceSheet.assets.grandTotal;
    const totalLiabilities = balanceSheet.liabilities.grandTotal;
    const totalEquity = balanceSheet.equity.grandTotal;
    const revenue = incomeStmt.totalRevenue;
    const netProfit = incomeStmt.netProfit;

    // Inventory valuation
    const invItems = SheetModel.getAll(CONFIG.SHEETS.INVENTORY);
    let totalInventory = 0;
    invItems.forEach(i => {
      totalInventory += (parseFloat(i.Stock_Qty) || 0) * (parseFloat(i.Cost_Price) || 0);
    });

    // 1. Current Ratio = Current Assets / Current Liabilities
    const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : "N/A";
    
    // 2. Quick Ratio = (Current Assets - Inventory) / Current Liabilities
    const quickAssets = Math.max(0, currentAssets - totalInventory);
    const quickRatio = currentLiabilities > 0 ? (quickAssets / currentLiabilities).toFixed(2) : "N/A";

    // 3. Debt to Equity Ratio (DER) = Total Liabilities / Total Equity
    const debtToEquity = totalEquity > 0 ? ((totalLiabilities / totalEquity) * 100).toFixed(2) + "%" : "N/A";

    // 4. Net Profit Margin = Net Profit / Revenue
    const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + "%" : "0%";

    // 5. Return on Assets (ROA) = Net Profit / Total Assets
    const roa = totalAssets > 0 ? ((netProfit / totalAssets) * 100).toFixed(2) + "%" : "0%";

    return {
      currentRatio,
      quickRatio,
      debtToEquity,
      netMargin,
      roa,
      totalInventoryValuation: totalInventory,
      healthScore: (parseFloat(currentRatio) >= 1.5 && parseFloat(netMargin) > 5) ? "Sangat Sehat (Optimal)" : "Cukup / Perlu Pengawasan"
    };
  }
};
