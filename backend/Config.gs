/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Config.gs - System Configuration & Constants
 * ============================================================================
 */

const CONFIG = {
  APP_NAME: "App Keuangan PT - Enterprise B2B",
  VERSION: "2.4.0",
  DEFAULT_TIMEZONE: "Asia/Jakarta",
  DEFAULT_CURRENCY: "IDR",
  
  // Sheet Names Mapping
  SHEETS: {
    CONFIG_TENANT: "Config_Tenant",
    COA: "COA",
    JURNAL_UMUM: "Jurnal_Umum",
    KAS_BANK: "Kas_Bank",
    INVOICES_AR: "Invoices_AR",
    EXPENSES_AP: "Expenses_AP",
    INVENTORY: "Inventory",
    PAYROLL: "Payroll",
    USERS_AUTH: "Users_Auth"
  },

  // Standard COA Account Categories
  ACCOUNT_CATEGORIES: {
    ASSET: "Asset",
    LIABILITY: "Liability",
    EQUITY: "Equity",
    REVENUE: "Revenue",
    EXPENSE: "Expense"
  },

  // User Roles & Permissions
  ROLES: {
    SUPERADMIN: "Superadmin",
    FINANCE: "Finance",
    AUDITOR: "Auditor"
  },

  // Default Tax Settings
  DEFAULT_TAX_PERCENTAGE: 11, // PPN 11%

  // Security / Token Secret
  AUTH_SECRET: "APP_KEUANGAN_SECRET_KEY_B2B_2026_ENTERPRISE",
  SESSION_DURATION_HOURS: 24
};

/**
 * Helper to get active spreadsheet
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
