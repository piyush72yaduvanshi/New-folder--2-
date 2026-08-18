/**
 * resourceController.js
 *
 * Charging Stations  —  GET /api/charging-stations
 *                       GET /api/charging-stations/:id
 *                       POST /api/charging-stations        (admin)
 *                       PUT  /api/charging-stations/:id    (admin)
 *
 * Guides / EV Tips   —  GET /api/guides
 *                       GET /api/guides/:id
 *                       POST /api/guides                   (admin)
 */

const logger = require("../../../src/utils/logger");
const db = require("../../../src/config/db");
 

//  CHARGING STATIONS
/**
 * GET /api/charging-stations
 * Query params:
 *   city         — filter by city name (case-insensitive)
 *   available    — "1" to show only available stations
 *   type         — "fast" | "slow" | "swap"
 *   limit        — default 50
 *   offset       — default 0
 */
exports.getAllChargingStations = async (req, res) => {
  try {
    const { city, available, type, limit: lim, offset: off } = req.query;
    const limit = Math.min(Number(lim || 50), 100);
    const offset = Math.max(Number(off || 0), 0);

    const conditions = [];
    const params = [];

    if (city) {
      conditions.push("LOWER(city) LIKE ?");
      params.push(`%${String(city).toLowerCase()}%`);
    }

    if (available === "1" || available === "true") {
      conditions.push("available_slots > 0");
    }

    if (type) {
      conditions.push("charger_type = ?");
      params.push(String(type).toLowerCase());
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT * FROM charging_stations ${where}
       ORDER BY name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM charging_stations ${where}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: Number(countRows[0].total),
        limit,
        offset,
        count: rows.length,
      },
    });
  } catch (error) {
    logger.error("Get Charging Stations Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/charging-stations/:id
 */
exports.getChargingStationById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT * FROM charging_stations WHERE station_id = ? LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Charging station not found" });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error("Get Charging Station Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/charging-stations  (admin)
 * Body: { name, address, city, latitude, longitude, charger_type,
 *         total_slots, available_slots, price_per_unit, phone?, image_url? }
 */
exports.createChargingStation = async (req, res) => {
  try {
    const {
      name, address, city, latitude, longitude,
      charger_type, total_slots, available_slots,
      price_per_unit, phone, image_url,
    } = req.body;

    if (!name || !city || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "name, city, latitude, and longitude are required",
      });
    }

    const validTypes = ["fast", "slow", "swap"];
    const cType = String(charger_type || "slow").toLowerCase();
    if (!validTypes.includes(cType)) {
      return res.status(400).json({
        success: false,
        message: "charger_type must be: fast | slow | swap",
      });
    }

    const [result] = await db.query(
      `INSERT INTO charging_stations
       (name, address, city, latitude, longitude, charger_type,
        total_slots, available_slots, price_per_unit, phone, image_url,
        is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        name, address || null, city,
        Number(latitude), Number(longitude),
        cType,
        Number(total_slots || 1),
        Number(available_slots != null ? available_slots : total_slots || 1),
        price_per_unit ? Number(price_per_unit) : null,
        phone || null,
        image_url || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Charging station added successfully",
      data: { station_id: result.insertId },
    });
  } catch (error) {
    logger.error("Create Charging Station Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/charging-stations/:id  (admin)
 * Body: any subset of station fields
 */
exports.updateChargingStation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = [
      "name", "address", "city", "latitude", "longitude",
      "charger_type", "total_slots", "available_slots",
      "price_per_unit", "phone", "image_url", "is_active",
    ];

    const fields = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) fields[k] = req.body[k];
    }

    if (!Object.keys(fields).length) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const setClause = Object.keys(fields).map(k => `${k} = ?`).join(", ");
    const values = Object.values(fields);

    const [result] = await db.query(
      `UPDATE charging_stations SET ${setClause}, updated_at = NOW() WHERE station_id = ?`,
      [...values, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Charging station not found" });
    }

    return res.status(200).json({ success: true, message: "Charging station updated" });
  } catch (error) {
    logger.error("Update Charging Station Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GUIDES / EV TIPS
// ────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/guides
 * Query: category ("safety"|"maintenance"|"charging"|"tips"|"faq"), limit, offset
 */
exports.getAllGuides = async (req, res) => {
  try {
    const { category, limit: lim, offset: off } = req.query;
    const limit = Math.min(Number(lim || 20), 50);
    const offset = Math.max(Number(off || 0), 0);

    const conditions = ["is_published = 1"];
    const params = [];

    if (category) {
      conditions.push("category = ?");
      params.push(String(category).toLowerCase());
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await db.query(
      `SELECT guide_id, title, slug, category, summary,
              thumbnail_url, read_time_minutes, is_featured, published_at
       FROM guides ${where}
       ORDER BY is_featured DESC, published_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { limit, offset, count: rows.length },
    });
  } catch (error) {
    logger.error("Get Guides Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/guides/:idOrSlug
 */
exports.getGuideById = async (req, res) => {
  try {
    const idOrSlug = req.params.idOrSlug;
    const isNumeric = /^\d+$/.test(idOrSlug);

    const col = isNumeric ? "guide_id" : "slug";

    const [rows] = await db.query(
      `SELECT * FROM guides WHERE ${col} = ? AND is_published = 1 LIMIT 1`,
      [isNumeric ? Number(idOrSlug) : idOrSlug]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Guide not found" });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error("Get Guide Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/guides  (admin)
 * Body: { title, slug, category, summary, content, thumbnail_url?,
 *         read_time_minutes?, is_featured?, is_published? }
 */
exports.createGuide = async (req, res) => {
  try {
    const {
      title, slug, category, summary, content,
      thumbnail_url, read_time_minutes, is_featured, is_published,
    } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({
        success: false,
        message: "title, category, and content are required",
      });
    }

    const validCategories = ["safety", "maintenance", "charging", "tips", "faq"];
    if (!validCategories.includes(String(category).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `category must be one of: ${validCategories.join(", ")}`,
      });
    }

    const cleanSlug = slug
      ? String(slug).toLowerCase().replace(/\s+/g, "-")
      : String(title).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const [result] = await db.query(
      `INSERT INTO guides
       (title, slug, category, summary, content, thumbnail_url,
        read_time_minutes, is_featured, is_published, published_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = 1, NOW(), NULL), NOW())`,
      [
        title,
        cleanSlug,
        String(category).toLowerCase(),
        summary || null,
        content,
        thumbnail_url || null,
        Number(read_time_minutes || 3),
        is_featured ? 1 : 0,
        is_published ? 1 : 0,
        is_published ? 1 : 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Guide created successfully",
      data: { guide_id: result.insertId, slug: cleanSlug },
    });
  } catch (error) {
    logger.error("Create Guide Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
