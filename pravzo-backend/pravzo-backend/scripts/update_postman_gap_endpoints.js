const fs = require('fs');
const path = require('path');

function updatePostmanFile(filePath) {
  console.log(`Processing Postman collection: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const collection = JSON.parse(raw);

  // Helper to create request item
  function createReq({ name, method, urlPath, query = [], body = null, description = '', sampleResponse = {} }) {
    const rawUrl = '{{baseUrl}}' + urlPath + (query.length > 0 ? ('?' + query.map(q => `${q.key}=${q.value}`).join('&')) : '');
    const pathSegments = urlPath.split('/').filter(Boolean);

    const reqObj = {
      name: name,
      request: {
        method: method,
        header: [
          { key: 'Accept', value: 'application/json', type: 'text' }
        ],
        url: {
          raw: rawUrl,
          host: ['{{baseUrl}}'],
          path: pathSegments,
          query: query.map(q => ({ key: q.key, value: q.value, description: q.description || '' }))
        },
        description: description
      },
      response: [
        {
          name: '200 OK',
          originalRequest: {
            method: method,
            url: { raw: rawUrl, host: ['{{baseUrl}}'], path: pathSegments }
          },
          status: 'OK',
          code: 200,
          _postman_previewlanguage: 'json',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: JSON.stringify(sampleResponse, null, 2)
        }
      ]
    };

    if (body) {
      reqObj.request.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
      reqObj.request.body = {
        mode: 'raw',
        raw: JSON.stringify(body, null, 2),
        options: { raw: { language: 'json' } }
      };
    }

    return reqObj;
  }

  let addedCount = 0;

  // 1. BI & Analytics -> Analytics Endpoints -> GET /api/super-admin/analytics/bookings
  const biFolder = collection.item.find(i => i.name && i.name.includes('BI & Analytics'));
  if (biFolder && biFolder.item) {
    const analyticsFolder = biFolder.item.find(i => i.name && i.name.includes('Analytics Endpoints'));
    if (analyticsFolder && analyticsFolder.item) {
      const exists = analyticsFolder.item.some(r => r.name && r.name.includes('Bookings Analytics'));
      if (!exists) {
        analyticsFolder.item.push(createReq({
          name: 'Get Bookings Analytics Summary & Trends',
          method: 'GET',
          urlPath: '/api/super-admin/analytics/bookings',
          query: [
            { key: 'startDate', value: '2026-01-01', description: 'Start date filter' },
            { key: 'endDate', value: '2026-12-31', description: 'End date filter' },
            { key: 'status', value: 'ACTIVE', description: 'Booking status filter' }
          ],
          description: 'Fetches comprehensive booking performance metrics including total volume, revenue, status breakdown, duration and daily trend analysis.',
          sampleResponse: {
            success: true,
            message: 'Booking analytics data compiled',
            data: {
              totalBookings: 120,
              totalRevenue: 450000,
              averageBookingValue: 3750,
              averageDurationDays: 14.5,
              statusBreakdown: [{ status: 'ACTIVE', count: 45 }, { status: 'COMPLETED', count: 75 }],
              paymentStatusBreakdown: [{ payment_status: 'PAID', count: 120 }],
              dailyTrend: [{ date: '2026-08-10', booking_count: 12, daily_revenue: 45000 }],
              byBranch: [{ branch_name: 'Bangalore Central Hub', branch_id: 1, booking_count: 80, total_revenue: 300000 }]
            }
          }
        }));
        addedCount++;
      }
    }
  }

  // 2. Super Admin Extensions
  const extFolder = collection.item.find(i => i.name && i.name.includes('Super Admin Extensions'));
  if (extFolder && extFolder.item) {
    // 2a. Audit Logs
    const auditFolder = extFolder.item.find(i => i.name && i.name.includes('Audit Logs'));
    if (auditFolder && auditFolder.item) {
      if (!auditFolder.item.some(r => r.name && r.name.includes('Get Audit Log By ID'))) {
        auditFolder.item.push(createReq({
          name: 'Get Audit Log By ID',
          method: 'GET',
          urlPath: '/api/super-admin/audit-logs/1',
          description: 'Fetch single audit log record detail with admin user metadata and full payload details.',
          sampleResponse: {
            success: true,
            message: 'Audit log detail fetched successfully',
            data: {
              audit_id: 1,
              admin_id: 101,
              action: 'UPDATE_SYSTEM_SETTING',
              module: 'SYSTEM',
              details: { key: 'platform.name', value: 'Pravzo' },
              ip_address: '127.0.0.1',
              user_agent: 'Mozilla/5.0',
              created_at: '2026-08-15T10:00:00.000Z',
              admin_name: 'Super Admin',
              admin_email: 'admin@pravzo.com',
              admin_role: 'SUPER_ADMIN'
            }
          }
        }));
        addedCount++;
      }
      if (!auditFolder.item.some(r => r.name && r.name.includes('Export Audit Logs CSV'))) {
        auditFolder.item.push(createReq({
          name: 'Export Audit Logs CSV',
          method: 'GET',
          urlPath: '/api/super-admin/audit-logs/export',
          query: [
            { key: 'module', value: 'AUTH', description: 'Filter export by module' },
            { key: 'limit', value: '500', description: 'Max records to export' }
          ],
          description: 'Exports audit trail logs as downloadable CSV report.',
          sampleResponse: { success: true, message: 'CSV stream returned' }
        }));
        addedCount++;
      }
    }

    // 2b. Vehicle Maintenance
    const maintFolder = extFolder.item.find(i => i.name && i.name.includes('Vehicle Maintenance'));
    if (maintFolder && maintFolder.item) {
      if (!maintFolder.item.some(r => r.name && r.name.includes('Get Maintenance Record By ID'))) {
        maintFolder.item.push(createReq({
          name: 'Get Maintenance Record By ID',
          method: 'GET',
          urlPath: '/api/super-admin/maintenance/1',
          description: 'Fetch detailed maintenance job record including costs, schedule, technician, and vehicle details.',
          sampleResponse: {
            success: true,
            message: 'Maintenance record fetched successfully',
            data: {
              maintenance_id: 1,
              vehicle_id: 10,
              maintenance_type: 'BRAKE_PAD_REPLACEMENT',
              description: 'Routine front and rear brake pad replacement',
              cost: 1500.00,
              status: 'IN_PROGRESS',
              scheduled_date: '2026-08-16',
              completed_date: null,
              performed_by: 101,
              registration_number: 'KA-01-EV-1234',
              model_name: 'Ather 450X',
              branch_name: 'Bangalore Hub'
            }
          }
        }));
        addedCount++;
      }
      if (!maintFolder.item.some(r => r.name && r.name.includes('Update Maintenance Record Detail'))) {
        maintFolder.item.push(createReq({
          name: 'Update Maintenance Record Detail',
          method: 'PUT',
          urlPath: '/api/super-admin/maintenance/1',
          body: {
            cost: 1800.00,
            status: 'COMPLETED',
            description: 'Brake pads replaced and tire pressure calibrated',
            completed_date: '2026-08-16'
          },
          description: 'Updates full maintenance job details.',
          sampleResponse: {
            success: true,
            message: 'Maintenance record updated successfully',
            data: { maintenance_id: 1, status: 'COMPLETED', cost: 1800.00 }
          }
        }));
        addedCount++;
      }
      if (!maintFolder.item.some(r => r.name && r.name.includes('Delete Maintenance Record'))) {
        maintFolder.item.push(createReq({
          name: 'Delete Maintenance Record',
          method: 'DELETE',
          urlPath: '/api/super-admin/maintenance/1',
          description: 'Deletes a maintenance record entry from the system.',
          sampleResponse: {
            success: true,
            message: 'Maintenance record deleted successfully',
            data: { success: true }
          }
        }));
        addedCount++;
      }
    }

    // 2c. Insurance Policies
    const insFolder = extFolder.item.find(i => i.name && i.name.includes('Insurance Policies'));
    if (insFolder && insFolder.item) {
      if (!insFolder.item.some(r => r.name && r.name.includes('Get Insurance Policy By ID'))) {
        insFolder.item.push(createReq({
          name: 'Get Insurance Policy By ID',
          method: 'GET',
          urlPath: '/api/super-admin/insurance/1',
          description: 'Fetch insurance policy details including coverage, premium, dates, and vehicle metadata.',
          sampleResponse: {
            success: true,
            message: 'Insurance policy fetched successfully',
            data: {
              insurance_id: 1,
              vehicle_id: 10,
              policy_number: 'POL-2026-987654',
              provider: 'HDFC ERGO General Insurance',
              start_date: '2026-01-01',
              expiry_date: '2027-01-01',
              premium_amount: 4500.00,
              coverage_details: 'Comprehensive Cover up to 150000',
              status: 'ACTIVE',
              registration_number: 'KA-01-EV-1234'
            }
          }
        }));
        addedCount++;
      }
      if (!insFolder.item.some(r => r.name && r.name.includes('Update Insurance Policy'))) {
        insFolder.item.push(createReq({
          name: 'Update Insurance Policy',
          method: 'PUT',
          urlPath: '/api/super-admin/insurance/1',
          body: {
            provider: 'HDFC ERGO General Insurance',
            policy_number: 'POL-2026-987654-REV',
            premium_amount: 4800.00,
            status: 'ACTIVE'
          },
          description: 'Updates policy details, premium, status, or coverage.',
          sampleResponse: {
            success: true,
            message: 'Insurance policy updated successfully',
            data: { insurance_id: 1, status: 'ACTIVE' }
          }
        }));
        addedCount++;
      }
      if (!insFolder.item.some(r => r.name && r.name.includes('Delete Insurance Policy'))) {
        insFolder.item.push(createReq({
          name: 'Delete Insurance Policy',
          method: 'DELETE',
          urlPath: '/api/super-admin/insurance/1',
          description: 'Deletes an insurance policy record from the database.',
          sampleResponse: {
            success: true,
            message: 'Insurance policy deleted successfully',
            data: { success: true }
          }
        }));
        addedCount++;
      }
    }

    // 2d. Support Tickets
    const ticketFolder = extFolder.item.find(i => i.name && i.name.includes('Support Tickets'));
    if (ticketFolder && ticketFolder.item) {
      if (!ticketFolder.item.some(r => r.name && r.name.includes('Get Support Ticket By ID'))) {
        ticketFolder.item.push(createReq({
          name: 'Get Support Ticket By ID',
          method: 'GET',
          urlPath: '/api/super-admin/support/tickets/1',
          description: 'Fetch single support ticket with requester information, status, priority, and resolution notes.',
          sampleResponse: {
            success: true,
            message: 'Support ticket fetched successfully',
            data: {
              ticket_id: 1,
              ticket_code: 'TKT-123456',
              user_id: 42,
              user_name: 'John Doe',
              user_email: 'john@example.com',
              category: 'BILLING',
              priority: 'HIGH',
              status: 'OPEN',
              subject: 'Incorrect wallet deduction during rental start',
              description: 'Deducted 500 security deposit twice',
              resolution_notes: null,
              created_at: '2026-08-16T08:00:00.000Z'
            }
          }
        }));
        addedCount++;
      }
      if (!ticketFolder.item.some(r => r.name && r.name.includes('Update Support Ticket Detail'))) {
        ticketFolder.item.push(createReq({
          name: 'Update Support Ticket Detail',
          method: 'PUT',
          urlPath: '/api/super-admin/support/tickets/1',
          body: {
            priority: 'CRITICAL',
            category: 'BILLING',
            assigned_admin_id: 101,
            description: 'Updated priority to critical after user escalated'
          },
          description: 'Updates support ticket properties (priority, category, assignee, description).',
          sampleResponse: {
            success: true,
            message: 'Support ticket updated successfully',
            data: { ticket_id: 1, priority: 'CRITICAL' }
          }
        }));
        addedCount++;
      }
      if (!ticketFolder.item.some(r => r.name && r.name.includes('Resolve Support Ticket'))) {
        ticketFolder.item.push(createReq({
          name: 'Resolve Support Ticket',
          method: 'POST',
          urlPath: '/api/super-admin/support/tickets/1/resolve',
          body: {
            resolution_notes: 'Duplicate charge refunded to user wallet successfully.'
          },
          description: 'Resolves a support ticket with resolution explanation and closes issue.',
          sampleResponse: {
            success: true,
            message: 'Support ticket resolved successfully',
            data: { ticket_id: 1, status: 'RESOLVED', resolution_notes: 'Duplicate charge refunded to user wallet successfully.' }
          }
        }));
        addedCount++;
      }
    }

    // 2e. Commission & Taxes
    const commTaxFolder = extFolder.item.find(i => i.name && i.name.includes('Commission & Taxes'));
    if (commTaxFolder && commTaxFolder.item) {
      if (!commTaxFolder.item.some(r => r.name && r.name.includes('Get Commission Rule By ID'))) {
        commTaxFolder.item.push(createReq({
          name: 'Get Commission Rule By ID',
          method: 'GET',
          urlPath: '/api/super-admin/commissions/rules/1',
          description: 'Fetch specific commission rule definition by ID.',
          sampleResponse: {
            success: true,
            message: 'Commission rule fetched successfully',
            data: {
              rule_id: 1,
              rule_name: 'E-Scooter Standard',
              vehicle_type: 'E_SCOOTER',
              city: 'Bangalore',
              commission_percentage: 10.00,
              min_commission: 0.00,
              max_commission: 500.00,
              is_active: 1,
              priority: 1
            }
          }
        }));
        addedCount++;
      }
      if (!commTaxFolder.item.some(r => r.name && r.name.includes('Update Commission Rule'))) {
        commTaxFolder.item.push(createReq({
          name: 'Update Commission Rule',
          method: 'PUT',
          urlPath: '/api/super-admin/commissions/rules/1',
          body: {
            commission_percentage: 12.50,
            max_commission: 600.00,
            is_active: 1
          },
          description: 'Updates commission calculation percentages and threshold limits.',
          sampleResponse: {
            success: true,
            message: 'Commission rule updated successfully',
            data: { rule_id: 1, commission_percentage: 12.50 }
          }
        }));
        addedCount++;
      }
      if (!commTaxFolder.item.some(r => r.name && r.name.includes('Delete Commission Rule'))) {
        commTaxFolder.item.push(createReq({
          name: 'Delete Commission Rule',
          method: 'DELETE',
          urlPath: '/api/super-admin/commissions/rules/1',
          description: 'Deletes a commission rule configuration.',
          sampleResponse: {
            success: true,
            message: 'Commission rule deleted successfully',
            data: { success: true }
          }
        }));
        addedCount++;
      }
      if (!commTaxFolder.item.some(r => r.name && r.name.includes('Get Tax Config By ID'))) {
        commTaxFolder.item.push(createReq({
          name: 'Get Tax Config By ID',
          method: 'GET',
          urlPath: '/api/super-admin/taxes/config/1',
          description: 'Fetch tax configuration by ID.',
          sampleResponse: {
            success: true,
            message: 'Tax configuration fetched successfully',
            data: {
              tax_id: 1,
              tax_name: 'GST 18%',
              rate_percentage: 18.00,
              hsn_sac_code: '996601',
              state_code: 'ALL',
              is_active: 1
            }
          }
        }));
        addedCount++;
      }
      if (!commTaxFolder.item.some(r => r.name && r.name.includes('Update Tax Config'))) {
        commTaxFolder.item.push(createReq({
          name: 'Update Tax Config',
          method: 'PUT',
          urlPath: '/api/super-admin/taxes/config/1',
          body: {
            rate_percentage: 18.00,
            is_active: 1
          },
          description: 'Updates tax configuration rate and state codes.',
          sampleResponse: {
            success: true,
            message: 'Tax configuration updated successfully',
            data: { tax_id: 1, rate_percentage: 18.00 }
          }
        }));
        addedCount++;
      }
      if (!commTaxFolder.item.some(r => r.name && r.name.includes('Delete Tax Config'))) {
        commTaxFolder.item.push(createReq({
          name: 'Delete Tax Config',
          method: 'DELETE',
          urlPath: '/api/super-admin/taxes/config/1',
          description: 'Deletes a tax configuration entry.',
          sampleResponse: {
            success: true,
            message: 'Tax configuration deleted successfully',
            data: { success: true }
          }
        }));
        addedCount++;
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(collection, null, 2), 'utf8');
  console.log(`Updated ${filePath}. Added ${addedCount} new requests.`);
}

updatePostmanFile('docs/Pravzo_Admin_API.postman_collection.json');
updatePostmanFile('docs/Pravzo_Unified_API.postman_collection.json');
