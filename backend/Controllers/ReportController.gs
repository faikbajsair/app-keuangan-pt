/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Controllers/ReportController.gs - Financial Analytics & Statements
 * ============================================================================
 */

const ReportController = {
  /**
   * Executive Dashboard Summary KPIs
   */
  getDashboardMetrics: function() {
    const todayStr = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const kasData = SheetModel.getAll(CONFIG.SHEETS.KAS_BANK);
    const invoices = SheetModel.getAll(CONFIG.SHEETS.INVOICES_AR);
    const expenses = SheetModel.getAll(CONFIG.SHEETS.EXPENSES_AP);
    const coaList = SheetModel.getAll(CONFIG.SHEETS.COA);
    const incomeStmt = AccountingService.getIncomeStatement();
    const balanceSheet = AccountingService.getBalanceSheet();
    const ratios = AccountingService.getFinancialRatios();

    // Total Liquid Cash (Sum of Kas & Bank balances)
    let totalCash = 0;
    const gl = AccountingService.getGeneralLedger();
    coaList.filter(c => c.Account_Code.startsWith("1-11")).forEach(c => {
      totalCash += (gl[c.Account_Code] ? gl[c.Account_Code].endingBalance : 0);
    });

    // Accounts Receivable Outstanding
    let arOutstanding = 0;
    let arOverdueCount = 0;
    let arDueH3Count = 0;
    const h3Date = new Date();
    h3Date.setDate(h3Date.getDate() + 3);
    const h3DateStr = Utilities.formatDate(h3Date, CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd");

    invoices.forEach(inv => {
      if (inv.Status !== "Paid") {
        const remaining = (parseFloat(inv.Grand_Total) || 0) - (parseFloat(inv.Amount_Paid) || 0);
        arOutstanding += remaining;
        if (inv.Due_Date && inv.Due_Date < todayStr) {
          arOverdueCount++;
        } else if (inv.Due_Date && inv.Due_Date <= h3DateStr) {
          arDueH3Count++;
        }
      }
    });

    // Accounts Payable Outstanding
    let apOutstanding = 0;
    let apOverdueCount = 0;
    let apDueH3Count = 0;

    expenses.forEach(exp => {
      if (exp.Status !== "Paid") {
        apOutstanding += (parseFloat(exp.Amount) || 0);
        if (exp.Due_Date && exp.Due_Date < todayStr) {
          apOverdueCount++;
        } else if (exp.Due_Date && exp.Due_Date <= h3DateStr) {
          apDueH3Count++;
        }
      }
    });

    // Recent 10 Transactions
    kasData.sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0));
    const recentTx = kasData.slice(0, 8);

    // Monthly Trend Data (Last 6 Months)
    const monthlyTrends = this.calculateMonthlyTrends(kasData);

    return {
      kpis: {
        totalCash,
        totalRevenue: incomeStmt.totalRevenue,
        totalExpense: incomeStmt.totalExpense,
        netProfit: incomeStmt.netProfit,
        profitMargin: incomeStmt.profitMargin,
        arOutstanding,
        apOutstanding,
        alerts: {
          arOverdueCount,
          arDueH3Count,
          apOverdueCount,
          apDueH3Count
        }
      },
      ratios,
      monthlyTrends,
      recentTransactions: recentTx
    };
  },

  /**
   * Helper to aggregate monthly income & expense trends
   */
  calculateMonthlyTrends: function(kasData) {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const trendMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      trendMap[key] = { month: key, revenue: 0, expense: 0, net: 0 };
    }

    kasData.forEach(k => {
      if (!k.Date) return;
      const d = new Date(k.Date);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (trendMap[key]) {
        const amt = parseFloat(k.Amount) || 0;
        if (k.Type === "IN") trendMap[key].revenue += amt;
        if (k.Type === "OUT") trendMap[key].expense += amt;
        trendMap[key].net = trendMap[key].revenue - trendMap[key].expense;
      }
    });

    return Object.values(trendMap);
  },

  /**
   * Laporan Laba Rugi
   */
  getIncomeStatement: function(startDate, endDate) {
    return AccountingService.getIncomeStatement(startDate, endDate);
  },

  /**
   * Laporan Neraca (Balance Sheet)
   */
  getBalanceSheet: function(asOfDate) {
    return AccountingService.getBalanceSheet(asOfDate);
  },

  /**
   * Laporan Arus Kas
   */
  getCashFlowStatement: function(startDate, endDate) {
    return AccountingService.getCashFlowStatement(startDate, endDate);
  },

  /**
   * Buku Besar (General Ledger)
   */
  getGeneralLedger: function(filterCOA, startDate, endDate) {
    return AccountingService.getGeneralLedger(filterCOA, startDate, endDate);
  },

  /**
   * Rasio Keuangan
   */
  getFinancialRatios: function() {
    return AccountingService.getFinancialRatios();
  }
};
