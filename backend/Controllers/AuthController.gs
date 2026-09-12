/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Controllers/AuthController.gs - Authentication & User Access Control
 * ============================================================================
 */

const AuthController = {
  /**
   * Helper to hash password (using Utilities.computeDigest SHA-256)
   */
  hashPassword: function(password) {
    const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
    let hashStr = "";
    for (let i = 0; i < rawHash.length; i++) {
      let byteVal = rawHash[i];
      if (byteVal < 0) byteVal += 256;
      let hexVal = byteVal.toString(16);
      if (hexVal.length === 1) hexVal = "0" + hexVal;
      hashStr += hexVal;
    }
    return hashStr;
  },

  /**
   * Generate lightweight stateless token
   */
  generateToken: function(user) {
    const payload = {
      userId: user.User_ID,
      username: user.Username,
      role: user.Role,
      exp: new Date().getTime() + (CONFIG.SESSION_DURATION_HOURS * 60 * 60 * 1000)
    };
    return Utilities.base64Encode(JSON.stringify(payload));
  },

  /**
   * Verify token validity and role permissions
   */
  verifyToken: function(token) {
    if (!token) throw new Error("Sesi tidak valid / Token otentikasi tidak ditemukan.");
    try {
      const decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
      const payload = JSON.parse(decoded);
      if (new Date().getTime() > payload.exp) {
        throw new Error("Sesi telah kedaluwarsa. Silakan login kembali.");
      }
      return payload;
    } catch (e) {
      throw new Error("Token otentikasi tidak valid atau telah kedaluwarsa.");
    }
  },

  /**
   * Login Handler
   */
  login: function(params) {
    const { username, password } = params;
    if (!username || !password) {
      throw new Error("Username dan password wajib diisi.");
    }

    const users = SheetModel.getAll(CONFIG.SHEETS.USERS_AUTH);
    const user = users.find(u => String(u.Username).toLowerCase() === String(username).toLowerCase());

    if (!user) {
      throw new Error("Akun pengguna tidak ditemukan.");
    }

    if (user.Status !== "Active") {
      throw new Error("Akun pengguna berstatus nonaktif. Hubungi Superadmin.");
    }

    const hashedPassword = this.hashPassword(password);
    // Allow fallback for initial plain demo pass or matching SHA256
    if (user.Password_Hash !== hashedPassword && user.Password_Hash !== password) {
      throw new Error("Password salah. Silakan coba lagi.");
    }

    // Update Last Login
    const now = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
    SheetModel.updateByField(CONFIG.SHEETS.USERS_AUTH, "User_ID", user.User_ID, {
      Last_Login: now
    });

    const token = this.generateToken(user);

    // Get Tenant info
    const tenantConfig = SheetModel.getAll(CONFIG.SHEETS.CONFIG_TENANT)[0] || {};

    return {
      success: true,
      token: token,
      user: {
        userId: user.User_ID,
        username: user.Username,
        fullName: user.Full_Name,
        role: user.Role
      },
      tenant: {
        companyName: tenantConfig.Company_Name || "PT Modern Finance Indonesia",
        logoUrl: tenantConfig.Company_Logo_URL || "",
        currency: tenantConfig.Currency_Symbol || "Rp",
        taxRate: tenantConfig.Tax_Rate || 11,
        licenseStatus: tenantConfig.License_Status || "Active"
      }
    };
  },

  /**
   * Get all users (Superadmin only)
   */
  getUsers: function(userPayload) {
    if (userPayload.role !== CONFIG.ROLES.SUPERADMIN) {
      throw new Error("Hanya Superadmin yang berhak mengakses data pengguna.");
    }
    const users = SheetModel.getAll(CONFIG.SHEETS.USERS_AUTH);
    return users.map(u => ({
      userId: u.User_ID,
      username: u.Username,
      fullName: u.Full_Name,
      role: u.Role,
      status: u.Status,
      lastLogin: u.Last_Login
    }));
  },

  /**
   * Add new user
   */
  createUser: function(params, userPayload) {
    if (userPayload.role !== CONFIG.ROLES.SUPERADMIN) {
      throw new Error("Hanya Superadmin yang berhak menambah pengguna.");
    }

    const { username, fullName, password, role } = params;
    if (!username || !fullName || !password || !role) {
      throw new Error("Semua field pengguna wajib diisi.");
    }

    const existing = SheetModel.findByField(CONFIG.SHEETS.USERS_AUTH, "Username", username);
    if (existing) {
      throw new Error(`Username "${username}" sudah digunakan.`);
    }

    const userId = "USR-" + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = this.hashPassword(password);
    const now = Utilities.formatDate(new Date(), CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");

    SheetModel.insert(CONFIG.SHEETS.USERS_AUTH, {
      User_ID: userId,
      Username: username,
      Full_Name: fullName,
      Password_Hash: hashedPassword,
      Role: role,
      Status: "Active",
      Last_Login: ""
    });

    return { success: true, message: "Pengguna berhasil ditambahkan.", userId };
  },

  /**
   * Update user status (Active / Inactive)
   */
  updateUserStatus: function(params, userPayload) {
    if (userPayload.role !== CONFIG.ROLES.SUPERADMIN) {
      throw new Error("Hanya Superadmin yang berhak mengubah status pengguna.");
    }
    const { userId, status } = params;
    SheetModel.updateByField(CONFIG.SHEETS.USERS_AUTH, "User_ID", userId, {
      Status: status
    });
    return { success: true, message: "Status pengguna diperbarui." };
  }
};
