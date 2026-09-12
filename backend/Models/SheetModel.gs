/**
 * ============================================================================
 * APP KEUANGAN PT - B2B COMMERCIAL ERP FINANCIAL SYSTEM
 * Models/SheetModel.gs - High-Performance Bulk Data Layer for Google Sheets
 * ============================================================================
 */

const SheetModel = {
  /**
   * Get sheet instance safely
   */
  getSheet: function(sheetName) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" tidak ditemukan. Silakan jalankan initDatabase().`);
    }
    return sheet;
  },

  /**
   * Get all rows as structured JavaScript objects
   * Bulk read using single getValues() call for optimal performance
   */
  getAll: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow <= 1 || lastCol === 0) {
      return [];
    }

    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0].map(h => String(h).trim());
    const rows = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Skip completely empty rows
      if (row.every(cell => cell === "" || cell === null || cell === undefined)) {
        continue;
      }

      const obj = { _rowIndex: i + 1 };
      for (let j = 0; j < headers.length; j++) {
        let val = row[j];
        // Format dates safely
        if (val instanceof Date) {
          val = Utilities.formatDate(val, CONFIG.DEFAULT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
        }
        obj[headers[j]] = val;
      }
      rows.push(obj);
    }

    return rows;
  },

  /**
   * Get headers of a sheet
   */
  getHeaders: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) return [];
    return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  },

  /**
   * Find a single record by column key and value
   */
  findByField: function(sheetName, fieldName, value) {
    const rows = this.getAll(sheetName);
    return rows.find(r => String(r[fieldName]).trim() === String(value).trim()) || null;
  },

  /**
   * Filter records by matching criteria object
   */
  where: function(sheetName, criteria) {
    const rows = this.getAll(sheetName);
    return rows.filter(row => {
      for (let key in criteria) {
        if (String(row[key]).trim() !== String(criteria[key]).trim()) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Insert a single row mapped from an object based on header names
   */
  insert: function(sheetName, recordObj) {
    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheetName);

    const rowData = headers.map(header => {
      let val = recordObj[header];
      if (val === undefined || val === null) {
        return "";
      }
      if (typeof val === 'object' && !(val instanceof Date)) {
        return JSON.stringify(val);
      }
      return val;
    });

    sheet.appendRow(rowData);
    SpreadsheetApp.flush();
    return recordObj;
  },

  /**
   * Insert multiple rows in a single batch operation (Crucial for multi-line journals)
   */
  insertBatch: function(sheetName, recordsArray) {
    if (!recordsArray || recordsArray.length === 0) return [];

    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheetName);
    const lastRow = sheet.getLastRow();

    const batchData = recordsArray.map(recordObj => {
      return headers.map(header => {
        let val = recordObj[header];
        if (val === undefined || val === null) {
          return "";
        }
        if (typeof val === 'object' && !(val instanceof Date)) {
          return JSON.stringify(val);
        }
        return val;
      });
    });

    sheet.getRange(lastRow + 1, 1, batchData.length, headers.length).setValues(batchData);
    SpreadsheetApp.flush();
    return recordsArray;
  },

  /**
   * Update record matching keyField = keyValue
   */
  updateByField: function(sheetName, keyField, keyValue, updateData) {
    const sheet = this.getSheet(sheetName);
    const rows = this.getAll(sheetName);
    const target = rows.find(r => String(r[keyField]).trim() === String(keyValue).trim());

    if (!target) {
      throw new Error(`Data dengan ${keyField} = "${keyValue}" tidak ditemukan di sheet ${sheetName}.`);
    }

    const headers = this.getHeaders(sheetName);
    const rowIndex = target._rowIndex;
    const currentRowValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];

    headers.forEach((header, colIdx) => {
      if (updateData[header] !== undefined) {
        let val = updateData[header];
        if (typeof val === 'object' && !(val instanceof Date)) {
          val = JSON.stringify(val);
        }
        currentRowValues[colIdx] = val;
      }
    });

    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([currentRowValues]);
    SpreadsheetApp.flush();
    return { ...target, ...updateData };
  },

  /**
   * Delete record matching keyField = keyValue
   */
  deleteByField: function(sheetName, keyField, keyValue) {
    const sheet = this.getSheet(sheetName);
    const rows = this.getAll(sheetName);
    const target = rows.find(r => String(r[keyField]).trim() === String(keyValue).trim());

    if (!target) {
      throw new Error(`Data dengan ${keyField} = "${keyValue}" tidak ditemukan untuk dihapus.`);
    }

    sheet.deleteRow(target._rowIndex);
    SpreadsheetApp.flush();
    return true;
  }
};
