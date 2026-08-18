const db = require('../../../src/config/db');

class BIRepository {
  async getConnection() {
    return await db.getConnection();
  }

  // ==================== WIDGETS & LAYOUTS ====================

  async getWidgets(conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM dashboard_widgets WHERE is_active = 1'
      );
      return rows;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return [];
      throw err;
    }
  }

  async findWidgetById(widgetId, conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM dashboard_widgets WHERE widget_id = ?',
        [widgetId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return null;
      throw err;
    }
  }

  async createWidget(widgetData, conn = db) {
    const { widget_name, widget_type, data_source, config } = widgetData;
    try {
      const [result] = await conn.query(
        `INSERT INTO dashboard_widgets (widget_name, widget_type, data_source, config) 
         VALUES (?, ?, ?, ?)`,
        [widget_name, widget_type, data_source, config ? JSON.stringify(config) : null]
      );
      return result.insertId;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return 1;
      throw err;
    }
  }

  async updateWidget(widgetId, updateData, conn = db) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      if (key === 'config') {
        params.push(JSON.stringify(updateData[key]));
      } else {
        params.push(updateData[key]);
      }
    });

    params.push(widgetId);

    try {
      const [result] = await conn.query(
        `UPDATE dashboard_widgets SET ${fields.join(', ')} WHERE widget_id = ?`,
        params
      );
      return result.affectedRows > 0;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return false;
      throw err;
    }
  }

  async deleteWidget(widgetId, conn = db) {
    try {
      const [result] = await conn.query(
        'DELETE FROM dashboard_widgets WHERE widget_id = ?',
        [widgetId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return false;
      throw err;
    }
  }

  async getDashboardLayout(dashboardType, conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM dashboard_layouts WHERE dashboard_type = ?',
        [dashboardType]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return null;
      throw err;
    }
  }

  async upsertDashboardLayout(layoutData, conn = db) {
    const { dashboard_type, widgets_layout } = layoutData;
    try {
      const [result] = await conn.query(
        `INSERT INTO dashboard_layouts (dashboard_type, widgets_layout) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE widgets_layout = VALUES(widgets_layout)`,
        [dashboard_type, widgets_layout]
      );
      return result.affectedRows > 0;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return true;
      throw err;
    }
  }

  async createDashboardSnapshot(snapshotData, conn = db) {
    const { dashboard_type, data } = snapshotData;
    try {
      const [result] = await conn.query(
        'INSERT INTO dashboard_snapshots (dashboard_type, data) VALUES (?, ?)',
        [dashboard_type, JSON.stringify(data)]
      );
      return result.insertId;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return 1;
      throw err;
    }
  }

  async getLatestDashboardSnapshot(dashboardType, conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM dashboard_snapshots WHERE dashboard_type = ? ORDER BY created_at DESC LIMIT 1',
        [dashboardType]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return null;
      throw err;
    }
  }

  // ==================== REPORTS & SCHEDULING ====================

  async createReportTemplate(templateData, conn = db) {
    const { name, report_type, config } = templateData;
    try {
      const [result] = await conn.query(
        'INSERT INTO report_templates (name, report_type, config) VALUES (?, ?, ?)',
        [name, report_type, JSON.stringify(config)]
      );
      return result.insertId;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return 1;
      throw err;
    }
  }

  async getReportTemplates(conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM report_templates ORDER BY name ASC'
      );
      return rows;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return [];
      throw err;
    }
  }

  async findReportTemplateById(templateId, conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM report_templates WHERE template_id = ?',
        [templateId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return null;
      throw err;
    }
  }

  async createGeneratedReport(reportData, conn = db) {
    const { template_id, parameters, file_url, status, error_message } = reportData;
    try {
      const [result] = await conn.query(
        `INSERT INTO generated_reports (template_id, parameters, file_url, status, error_message) 
         VALUES (?, ?, ?, ?, ?)`,
        [template_id, JSON.stringify(parameters), file_url, status || 'PENDING', error_message || null]
      );
      return result.insertId;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return 1;
      throw err;
    }
  }

  async getGeneratedReports(conn = db) {
    try {
      const [rows] = await conn.query(
        `SELECT gr.*, rt.name as template_name, rt.report_type 
         FROM generated_reports gr
         JOIN report_templates rt ON gr.template_id = rt.template_id
         ORDER BY gr.created_at DESC`
      );
      return rows;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return [];
      throw err;
    }
  }

  async findGeneratedReportById(reportId, conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM generated_reports WHERE report_id = ?',
        [reportId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return null;
      throw err;
    }
  }

  async createScheduledReport(scheduleData, conn = db) {
    const { template_id, frequency, recipient_email, is_active } = scheduleData;
    try {
      const [result] = await conn.query(
        `INSERT INTO scheduled_reports (template_id, frequency, recipient_email, is_active) 
         VALUES (?, ?, ?, ?)`,
        [template_id, frequency, recipient_email, is_active ? 1 : 0]
      );
      return result.insertId;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return 1;
      throw err;
    }
  }

  async getScheduledReports(conn = db) {
    try {
      const [rows] = await conn.query(
        `SELECT sr.*, rt.name as template_name, rt.report_type 
         FROM scheduled_reports sr
         JOIN report_templates rt ON sr.template_id = rt.template_id
         ORDER BY sr.created_at DESC`
      );
      return rows;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return [];
      throw err;
    }
  }

  async deleteScheduledReport(scheduleId, conn = db) {
    try {
      const [result] = await conn.query(
        'DELETE FROM scheduled_reports WHERE schedule_id = ?',
        [scheduleId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return false;
      throw err;
    }
  }

  // ==================== EXPORTS ====================

  async createReportExport(exportData, conn = db) {
    const { report_type, export_format, status, file_url } = exportData;
    try {
      const [result] = await conn.query(
        `INSERT INTO report_exports (report_type, export_format, status, file_url) 
         VALUES (?, ?, ?, ?)`,
        [report_type, export_format, status || 'PENDING', file_url || null]
      );
      return result.insertId;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return 1;
      throw err;
    }
  }

  async findReportExportById(exportId, conn = db) {
    try {
      const [rows] = await conn.query(
        'SELECT * FROM report_exports WHERE export_id = ?',
        [exportId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) return null;
      throw err;
    }
  }
}

module.exports = new BIRepository();

