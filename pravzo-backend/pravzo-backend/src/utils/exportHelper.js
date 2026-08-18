'use strict';



const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');

function validateExportFormat(format) {
  if (!format || typeof format !== 'string' || format.trim() === '') {
    return { valid: false, fmt: '', error: 'Query parameter "format" is required. Use "csv" or "excel".' };
  }
  const fmt = format.trim().toLowerCase();
  if (fmt !== 'csv' && fmt !== 'excel') {
    return { valid: false, fmt, error: `Unsupported export format "${format}". Use "csv" or "excel".` };
  }
  return { valid: true, fmt, error: null };
}


async function exportToFile(res, data, format, filenamePrefix = 'export') {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data available for export');
  }

  const fmt = (format || '').toString().toLowerCase();

  if (fmt === 'csv') {
    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filenamePrefix}-export-${Date.now()}.csv`
    );
    res.send(csv);
    return;
  }

  if (fmt === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(capitalize(filenamePrefix));

    // Build columns from first row's keys
    const keys = Object.keys(data[0]);
    worksheet.columns = keys.map(key => ({
      header: key,
      key,
      width: 22
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Add data rows
    data.forEach(row => worksheet.addRow(row));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filenamePrefix}-export-${Date.now()}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  throw new Error(`Unsupported export format: "${format}". Use "csv" or "excel".`);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { exportToFile, validateExportFormat };
