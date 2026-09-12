/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Code.gs - Main API Gateway & Web App Router (doGet / doPost)
 * ============================================================================
 */

/**
 * Handle HTTP GET Requests (Read operations)
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || "ping";

    let result = null;

    switch (action) {
      case "ping":
        result = { 
          status: "healthy", 
          app: CONFIG.APP_NAME, 
          version: CONFIG.VERSION, 
          timestamp: new Date().toISOString() 
        };
        break;

      case "initDb":
        result = { message: initDatabase() };
        break;

      case "getTenantConfig":
        result = AdminCMSController.getTenantConfig();
        break;

      case "getDashboardMetrics":
        result = ReportController.getDashboardMetrics();
        break;

      case "getCOA":
        result = TransactionController.getCOA();
        break;

      case "getKasBank":
        result = TransactionController.getKasBank(params.type, params.account);
        break;

      case "getInvoices":
        result = TransactionController.getInvoices(params.status);
        break;

      case "getExpenses":
        result = TransactionController.getExpenses(params.status);
        break;

      case "getInventory":
        result = TransactionController.getInventory();
        break;

      case "getPayroll":
        result = TransactionController.getPayroll(params.period);
        break;

      case "getJournals":
        result = TransactionController.getJournals(parseInt(params.limit) || null);
        break;

      case "getIncomeStatement":
        result = ReportController.getIncomeStatement(params.startDate, params.endDate);
        break;

      case "getBalanceSheet":
        result = ReportController.getBalanceSheet(params.asOfDate);
        break;

      case "getCashFlowStatement":
        result = ReportController.getCashFlowStatement(params.startDate, params.endDate);
        break;

      case "getGeneralLedger":
        result = ReportController.getGeneralLedger(params.coa, params.startDate, params.endDate);
        break;

      case "getFinancialRatios":
        result = ReportController.getFinancialRatios();
        break;

      case "getUsers":
        const authUser = AuthController.verifyToken(params.token);
        result = AuthController.getUsers(authUser);
        break;

      default:
        throw new Error(`Endpoint GET action "${action}" tidak dikenali.`);
    }

    return createJsonResponse({ success: true, data: result });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message || String(error) });
  }
}

/**
 * Handle HTTP POST Requests (Mutations & Secure Actions)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        // Fallback for form-urlencoded or parameter payload
        payload = (e && e.parameter) ? e.parameter : {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    if (!action) {
      throw new Error("Parameter 'action' wajib disertakan dalam request POST.");
    }

    let result = null;

    // Public Actions
    if (action === "login") {
      result = AuthController.login(payload);
      return createJsonResponse(result);
    }

    // Protected Actions - Token Verification
    let userPayload = { username: "demo_admin", role: CONFIG.ROLES.SUPERADMIN };
    if (payload.token) {
      userPayload = AuthController.verifyToken(payload.token);
    }

    switch (action) {
      // COA
      case "createCOA":
        result = TransactionController.createCOA(payload);
        break;

      // Kas & Bank
      case "createKasBank":
        result = TransactionController.createKasBank(payload, userPayload);
        break;

      // Invoices (AR)
      case "createInvoice":
        result = TransactionController.createInvoice(payload, userPayload);
        break;

      case "payInvoice":
        result = TransactionController.payInvoice(payload, userPayload);
        break;

      // Expenses (AP)
      case "createExpense":
        result = TransactionController.createExpense(payload, userPayload);
        break;

      case "payExpense":
        result = TransactionController.payExpense(payload, userPayload);
        break;

      // Inventory
      case "createInventoryItem":
        result = TransactionController.createInventoryItem(payload);
        break;

      case "adjustStock":
        result = TransactionController.adjustStock(payload);
        break;

      // Payroll
      case "createPayroll":
        result = TransactionController.createPayroll(payload, userPayload);
        break;

      // Manual Journal
      case "createManualJournal":
        result = TransactionController.createManualJournal(payload, userPayload);
        break;

      // Bank Reconciliation
      case "reconcileBank":
        result = TransactionController.reconcileBankTransactions(payload);
        break;

      // Tenant Settings
      case "updateTenantConfig":
        result = AdminCMSController.updateTenantConfig(payload, userPayload);
        break;

      // User Management
      case "createUser":
        result = AuthController.createUser(payload, userPayload);
        break;

      case "updateUserStatus":
        result = AuthController.updateUserStatus(payload, userPayload);
        break;

      default:
        throw new Error(`Endpoint POST action "${action}" tidak dikenali.`);
    }

    return createJsonResponse({ success: true, ...result });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message || String(error) });
  }
}

/**
 * Format standard JSON response with CORS headers
 */
function createJsonResponse(outputObj) {
  return ContentService.createTextOutput(JSON.stringify(outputObj))
    .setMimeType(ContentService.MimeType.JSON);
}
