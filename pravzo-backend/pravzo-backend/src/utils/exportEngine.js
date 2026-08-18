const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const logger = require('./logger');



class ExportEngine {

  exportToCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }
    const parser = new Parser();
    return parser.parse(data);
  }


  async exportToExcel(data, sheetName = 'Sheet1') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data && data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Add rows
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.columns.forEach(column => {
        column.width = 20;
      });
    } else {
      worksheet.addRow(['No data available']);
    }

    return await workbook.xlsx.writeBuffer();
  }


  async exportToPDF(data) {
    logger.info('[ExportEngine] Compiling mock PDF buffer');
    const content = JSON.stringify(data, null, 2);
    // Standard mock PDF signature header block
    const mockPDFHeader = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000223 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n320\n%%EOF`;
    return Buffer.from(mockPDFHeader, 'utf-8');
  }


  async executeBackgroundExport(exportId, reportType, format, data) {
    logger.info(`[ExportEngine] Starting background export job ${exportId} for format ${format}`);
    
    // Simulate background delay
    setImmediate(async () => {
      let writeConn;
      try {
        let buffer;
        let ext = 'csv';
        let mimeType = 'text/csv';

        if (format === 'CSV') {
          buffer = Buffer.from(this.exportToCSV(data), 'utf-8');
          ext = 'csv';
          mimeType = 'text/csv';
        } else if (format === 'EXCEL') {
          buffer = await this.exportToExcel(data, reportType);
          ext = 'xlsx';
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else {
          buffer = await this.exportToPDF(data);
          ext = 'pdf';
          mimeType = 'application/pdf';
        }

        // Write the file locally to the exports directory inside public/exports
        const filename = `export_${reportType.toLowerCase()}_${Date.now()}.${ext}`;
        const relativeDir = 'public/exports';
        const absoluteDir = path.resolve(relativeDir);

        if (!fs.existsSync(absoluteDir)) {
          fs.mkdirSync(absoluteDir, { recursive: true });
        }

        const absolutePath = path.join(absoluteDir, filename);
        fs.writeFileSync(absolutePath, buffer);

        const fileUrl = `/exports/${filename}`;

        writeConn = await db.getConnection();
        await writeConn.query(
          "UPDATE report_exports SET status = 'COMPLETED', file_url = ? WHERE export_id = ?",
          [fileUrl, exportId]
        );
        logger.info(`[ExportEngine] Background export job ${exportId} completed successfully. File: ${fileUrl}`);
      } catch (err) {
        logger.error(`[ExportEngine] Background export job ${exportId} failed:`, err);
        if (writeConn) {
          try {
            await writeConn.query(
              "UPDATE report_exports SET status = 'FAILED' WHERE export_id = ?",
              [exportId]
            );
          } catch (e) {
            // Ignore if report_exports table doesn't exist
          }
        }
      } finally {
        if (writeConn) writeConn.release();
      }
    });
  }
}

module.exports = new ExportEngine();
