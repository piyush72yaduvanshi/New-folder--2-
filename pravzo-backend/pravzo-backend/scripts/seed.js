require("dotenv").config();
const db = require("../src/config/db");

async function tableExists(tableName) {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  return Number(rows[0].n) > 0;
}

async function seedVehicles() {
  if (!(await tableExists("vehicles"))) {
    console.log("Skipping vehicle seed: table not found");
    return;
  }

  const vehicles = [
    {
      model_name: "Pravzo X1",
      battery_percentage: 94,
      estimated_range_km: 120,
      top_speed_kmh: 70,
      price_per_week: 350.0,
      status: "AVAILABLE",
      image_url: "assets/images/scooter.png",
      battery_type: "Exchangeable",
      registration_number: "KA-01-EV-1001",
      assigned_hub: "Indiranagar Hub",
    },
    {
      model_name: "Pravzo NEX",
      battery_percentage: 85,
      estimated_range_km: 100,
      top_speed_kmh: 60,
      price_per_week: 300.0,
      status: "AVAILABLE",
      image_url: "assets/images/scooter.png",
      battery_type: "Non-Exchangeable",
      registration_number: "KA-01-EV-1002",
      assigned_hub: "Indiranagar Hub",
    },
  ];

  for (const vehicle of vehicles) {
    await db.query(
      `INSERT INTO vehicles (
        model_name, battery_percentage, estimated_range_km, top_speed_kmh,
        price_per_week, status, image_url, battery_type, registration_number, assigned_hub
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        model_name = VALUES(model_name),
        battery_percentage = VALUES(battery_percentage),
        estimated_range_km = VALUES(estimated_range_km),
        top_speed_kmh = VALUES(top_speed_kmh),
        price_per_week = VALUES(price_per_week),
        status = VALUES(status),
        image_url = VALUES(image_url),
        battery_type = VALUES(battery_type),
        assigned_hub = VALUES(assigned_hub)`,
      [
        vehicle.model_name,
        vehicle.battery_percentage,
        vehicle.estimated_range_km,
        vehicle.top_speed_kmh,
        vehicle.price_per_week,
        vehicle.status,
        vehicle.image_url,
        vehicle.battery_type,
        vehicle.registration_number,
        vehicle.assigned_hub,
      ],
    );
  }

  console.log("✓ Vehicles seeded");
}

async function seedJobs() {
  if (!(await tableExists("jobs"))) {
    console.log("Skipping job seed: table not found");
    return;
  }

  const hasJobTitle = await columnExists("jobs", "job_title");
  const hasClientName = await columnExists("jobs", "client_name");
  const hasDropoffAddress = await columnExists("jobs", "dropoff_address");

  const titleCol = hasJobTitle ? "job_title" : "title";
  const partnerCol = hasClientName ? "client_name" : "partner_name";
  const dropCol = hasDropoffAddress ? "dropoff_address" : "delivery_address";

  const jobs = [
    {
      title: "Swiggy delivery",
      partner_name: "Swiggy",
      pickup_address: "The Biryani House",
      delivery_address: "Tech Park Phase 1",
      estimated_earnings: 42.0,
      status: "PENDING",
    },
    {
      title: "Zomato delivery",
      partner_name: "Zomato",
      pickup_address: "Pizza Hut",
      delivery_address: "Kormangala Residency",
      estimated_earnings: 55.0,
      status: "PENDING",
    },
    {
      title: "Blinkit delivery",
      partner_name: "Blinkit",
      pickup_address: "Blinkit Dark Store",
      delivery_address: "Indiranagar Flat A",
      estimated_earnings: 35.0,
      status: "PENDING",
    },
  ];

  for (const job of jobs) {
    const existing = await db.query(
      `SELECT job_id FROM jobs WHERE \`${partnerCol}\` = ? AND pickup_address = ? AND \`${dropCol}\` = ? LIMIT 1`,
      [job.partner_name, job.pickup_address, job.delivery_address],
    );

    if (existing[0].length) {
      continue;
    }

    await db.query(
      `INSERT INTO jobs (\`${titleCol}\`, \`${partnerCol}\`, pickup_address, \`${dropCol}\`, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        job.title,
        job.partner_name,
        job.pickup_address,
        job.delivery_address,
        job.status,
      ],
    );
  }

  console.log("✓ Jobs seeded");
}

async function seedPhase2Data() {
  if (!(await tableExists("coupons"))) {
    console.log("Skipping Phase-2 seed: coupons table not found");
    return;
  }

  const coupons = [
    {
      code: "PRAVAZO10",
      description: "10% off on all bookings",
      discount_type: "PERCENT",
      discount_value: 10,
      max_discount_amount: 200,
      min_order_amount: 300,
      max_uses_per_user: 3,
      max_total_uses: 1000,
    },
    {
      code: "FLAT100",
      description: "Flat ₹100 off above ₹500",
      discount_type: "FLAT",
      discount_value: 100,
      max_discount_amount: null,
      min_order_amount: 500,
      max_uses_per_user: 2,
      max_total_uses: 500,
    },
    {
      code: "NEWUSER50",
      description: "₹50 off for new users",
      discount_type: "FLAT",
      discount_value: 50,
      max_discount_amount: null,
      min_order_amount: 200,
      max_uses_per_user: 1,
      max_total_uses: null,
    },
  ];

  for (const coupon of coupons) {
    const [existing] = await db.query(
      `SELECT coupon_id FROM coupons WHERE code = ? LIMIT 1`,
      [coupon.code],
    );
    if (!existing.length) {
      await db.query(
        `INSERT INTO coupons (code, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses_per_user, max_total_uses, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
        [
          coupon.code,
          coupon.description,
          coupon.discount_type,
          coupon.discount_value,
          coupon.max_discount_amount,
          coupon.min_order_amount,
          coupon.max_uses_per_user,
          coupon.max_total_uses,
        ],
      );
    }
  }

  if (await tableExists("charging_stations")) {
    const [stationRows] = await db.query(
      `SELECT station_id FROM charging_stations LIMIT 1`,
    );
    if (!stationRows.length) {
      const stations = [
        [
          "Pravazo Hub Bangalore",
          "MG Road",
          "Bangalore",
          12.9716,
          77.5946,
          "fast",
          4,
          2,
          8.5,
          "9876543210",
          "http://localhost:3000/uploads/charger.jpg",
        ],
        [
          "Pravazo Hub Bangalore 2",
          "Koramangala",
          "Bangalore",
          12.9352,
          77.6245,
          "slow",
          3,
          1,
          6.0,
          "9876543211",
          null,
        ],
        [
          "Pravazo Hub Lucknow",
          "Hazratganj",
          "Lucknow",
          26.8467,
          80.9462,
          "fast",
          2,
          1,
          7.5,
          "9876543212",
          null,
        ],
        [
          "Pravazo Hub Lucknow 2",
          "Gomti Nagar",
          "Lucknow",
          26.8565,
          80.9462,
          "swap",
          2,
          0,
          5.0,
          "9876543213",
          null,
        ],
        [
          "Pravazo Hub Delhi",
          "Connaught Place",
          "Delhi",
          28.6139,
          77.209,
          "fast",
          3,
          1,
          9.0,
          "9876543214",
          null,
        ],
      ];

      for (const station of stations) {
        await db.query(
          `INSERT INTO charging_stations (name, address, city, latitude, longitude, charger_type, total_slots, available_slots, price_per_unit, phone, image_url, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
          station,
        );
      }
    }
  }

  if (await tableExists("guides")) {
    const [guideRows] = await db.query(`SELECT guide_id FROM guides LIMIT 1`);
    if (!guideRows.length) {
      const guides = [
        [
          "EV Battery Safety",
          "ev-battery-safety",
          "safety",
          "How to safely charge and maintain your EV battery",
          "Keep your battery healthy by avoiding high heat and using certified chargers.",
          "http://localhost:3000/uploads/guide.jpg",
          4,
          1,
          1,
        ],
        [
          "Routine EV Maintenance",
          "routine-ev-maintenance",
          "maintenance",
          "Quick checks for everyday EV care",
          "Inspect tyres, brake health, and software updates regularly.",
          null,
          3,
          0,
          1,
        ],
        [
          "Charging Tips",
          "charging-tips",
          "charging",
          "Best practices for daily charging",
          "Charge during cooler hours and avoid overcharging whenever possible.",
          null,
          2,
          0,
          1,
        ],
        [
          "Rider Safety Essentials",
          "rider-safety-essentials",
          "tips",
          "Stay safe while using your EV",
          "Wear helmets, keep emergency contacts handy, and plan your route.",
          null,
          3,
          0,
          1,
        ],
        [
          "EV FAQ",
          "ev-faq",
          "faq",
          "Common questions answered",
          "This guide covers frequent doubts around range, charging, and rentals.",
          null,
          2,
          1,
          1,
        ],
      ];

      for (const guide of guides) {
        await db.query(
          `INSERT INTO guides (title, slug, category, summary, content, thumbnail_url, read_time_minutes, is_featured, is_published, published_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          guide,
        );
      }
    }
  }

  console.log("✓ Phase-2 sample data seeded");
}

async function seedBookingSample() {
  if (!(await tableExists("bookings"))) {
    console.log("Skipping booking seed: table not found");
    return;
  }

  const [existingBookings] = await db.query(
    `SELECT booking_id FROM bookings LIMIT 1`,
  );

  if (existingBookings.length) {
    console.log("✓ Booking sample already exists");
    return;
  }

  const [users] = await db.query(
    `SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1`,
  );
  if (!users.length) {
    console.log("Skipping booking seed: no users found");
    return;
  }

  const [vehicles] = await db.query(
    `SELECT vehicle_id FROM vehicles ORDER BY vehicle_id ASC LIMIT 1`,
  );
  if (!vehicles.length) {
    console.log("Skipping booking seed: no vehicles found");
    return;
  }

  await db.query(
    `INSERT INTO bookings (
      user_id, vehicle_id, start_date, end_date, rental_rate_per_week,
      total_amount, security_deposit, status, payment_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'PAID', NOW(), NOW())`,
    [
      users[0].user_id,
      vehicles[0].vehicle_id,
      "2025-08-01",
      "2025-08-07",
      300.0,
      800.0,
      500.0,
    ],
  );

  console.log("✓ Booking sample seeded");
}

async function seedNotifications() {
  if (!(await tableExists("notifications"))) {
    console.log("Skipping notification seed: table not found");
    return;
  }

  const hasUserId = await columnExists("notifications", "user_id");
  if (!hasUserId) {
    console.log("Skipping notification seed: user_id column not in notifications table");
    return;
  }

  const [existingUsers] = await db.query(
    `SELECT user_id FROM users ORDER BY user_id ASC LIMIT 10`,
  );

  if (!existingUsers.length) {
    console.log("Skipping notification seed: no users found");
    return;
  }

  const notifications = [
    {
      title: "Welcome to Pravzo",
      message:
        "Your account is ready. Start exploring available vehicles and rides.",
      type: "INFO",
      route_target: "dashboard",
    },
    {
      title: "New booking available",
      message: "A new ride request is waiting for your response.",
      type: "BOOKING",
      route_target: "bookings",
    },
    {
      title: "Payment received",
      message: "Your latest payment has been successfully processed.",
      type: "PAYMENT",
      route_target: "payments",
    },
  ];

  for (const user of existingUsers) {
    for (const notification of notifications) {
      const [existing] = await db.query(
        `SELECT notification_id FROM notifications WHERE user_id = ? AND title = ? LIMIT 1`,
        [user.user_id, notification.title],
      );

      if (!existing.length) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, route_target, is_read)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [
            user.user_id,
            notification.title,
            notification.message,
            notification.type,
            notification.route_target,
          ],
        );
      }
    }
  }

  console.log("✓ Notifications seeded");
}

async function seed() {
  try {
    console.log("Starting Pravzo sample data seed...");

    await seedVehicles();
    await seedJobs();
    await seedPhase2Data();
    await seedBookingSample();
    await seedNotifications();

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
