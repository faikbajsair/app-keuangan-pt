/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Controllers/AdminCMSController.gs - Tenant Branding & License Management
 * ============================================================================
 */

const AdminCMSController = {
  /**
   * Get Tenant & System Settings
   */
  getTenantConfig: function() {
    const configs = SheetModel.getAll(CONFIG.SHEETS.CONFIG_TENANT);
    const tenant = configs[0] || {
      Company_Name: "PT Modern Enterprise Indonesia",
      Company_Address: "Gedung Cyber 2 Tower Lt. 18, Jakarta Selatan",
      Company_Logo_URL: "",
      License_Key: "LIC-PRO-ENTERPRISE-2026",
      License_Status: "Active",
      Transaction_Quota: 10000,
      Currency_Symbol: "Rp",
      Fiscal_Year: "2026",
      Tax_Rate: 11
    };

    // Calculate Quota Usage
    const totalJournals = SheetModel.getAll(CONFIG.SHEETS.JURNAL_UMUM).length;
    const totalKas = SheetModel.getAll(CONFIG.SHEETS.KAS_BANK).length;
    const quotaUsed = totalJournals + totalKas;

    return {
      ...tenant,
      quotaUsed,
      quotaRemaining: Math.max(0, (parseInt(tenant.Transaction_Quota) || 10000) - quotaUsed)
    };
  },

  /**
   * Update Tenant Branding & Configuration
   */
  updateTenantConfig: function(params, userPayload) {
    if (userPayload.role !== CONFIG.ROLES.SUPERADMIN) {
      throw new Error("Hanya Superadmin yang berhak mengubah pengaturan perusahaan.");
    }

    const { companyName, companyAddress, companyLogoUrl, currencySymbol, fiscalYear, taxRate, licenseKey } = params;
    const now = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");

    const updateObj = {
      Company_Name: companyName,
      Company_Address: companyAddress,
      Company_Logo_URL: companyLogoUrl,
      Currency_Symbol: currencySymbol || "Rp",
      Fiscal_Year: fiscalYear || "2026",
      Tax_Rate: parseFloat(taxRate) || 11,
      Updated_At: now
    };

    if (licenseKey) {
      updateObj.License_Key = licenseKey;
      // Auto-validate enterprise license key
      updateObj.License_Status = licenseKey.includes("ENTERPRISE") || licenseKey.includes("PRO") ? "Active" : "Trial";
      updateObj.Transaction_Quota = licenseKey.includes("ENTERPRISE") ? 50000 : 5000;
    }

    const configs = SheetModel.getAll(CONFIG.SHEETS.CONFIG_TENANT);
    if (configs.length === 0) {
      SheetModel.insert(CONFIG.SHEETS.CONFIG_TENANT, updateObj);
    } else {
      SheetModel.updateByField(CONFIG.SHEETS.CONFIG_TENANT, "License_Key", configs[0].License_Key, updateObj);
    }

    return { success: true, message: "Pengaturan Tenant & Lisensi berhasil disimpan." };
  }
};
