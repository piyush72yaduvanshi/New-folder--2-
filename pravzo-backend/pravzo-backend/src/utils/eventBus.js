const db = require('../config/db');
const crypto = require('crypto');
const logger = require('./logger');

class EventBus {
  constructor() {
    this.subscribers = {};
  }

 
  subscribe(eventType, handler) {
    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = [];
    }
    this.subscribers[eventType].push(handler);
    logger.info(`[EventBus] Subscriber registered for event: ${eventType}`);
  }

  
  async publish(eventType, payload, idempotencyKey = null, conn = db) {
    logger.info(`[EventBus] Publishing event: ${eventType}`, { idempotencyKey });

    // Check idempotency if key provided
    if (idempotencyKey) {
      const [existing] = await conn.query(
        'SELECT event_id, status FROM events WHERE idempotency_key = ?',
        [idempotencyKey]
      );
      if (existing.length > 0) {
        logger.warn(`[EventBus] Duplicate event blocked by idempotency key: ${idempotencyKey}`);
        return existing[0].event_id;
      }
    }

    const payloadStr = JSON.stringify(payload);

    // Save event to database for audit trail and failure tolerance
    const [result] = await conn.query(
      'INSERT INTO events (event_type, payload, status, idempotency_key) VALUES (?, ?, ?, ?)',
      [eventType, payloadStr, 'PENDING', idempotencyKey]
    );

    const eventId = result.insertId;

    // Trigger async execution so we don't block the calling controller/service thread
    setImmediate(async () => {
      try {
        await this.dispatch(eventId, eventType, payload);
      } catch (err) {
        logger.error(`[EventBus] Error dispatching event ${eventId}:`, err);
      }
    });

    return eventId;
  }

  /**
   * Dispatches the event to all registered subscribers.
   */
  async dispatch(eventId, eventType, payload) {
    const handlers = this.subscribers[eventType] || [];
    if (handlers.length === 0) {
      logger.info(`[EventBus] No subscribers registered for event type: ${eventType}`);
      const writeConn = await db.getConnection();
      try {
        await writeConn.query('UPDATE events SET status = ? WHERE event_id = ?', ['PROCESSED', eventId]);
      } finally {
        writeConn.release();
      }
      return;
    }

    let allSuccess = true;

    for (const handler of handlers) {
      try {
        // Execute subscriber handler callback
        await handler(payload);
      } catch (err) {
        allSuccess = false;
        logger.error(`[EventBus] Subscriber failed for event ${eventId}: ${err.message}`);
        
        // Log failure details to event_failures (DLQ Mechanics)
        const writeConn = await db.getConnection();
        try {
          // Find or create a subscriber record for logging
          let [subRows] = await writeConn.query(
            'SELECT subscriber_id FROM event_subscribers WHERE event_type = ? AND handler_endpoint = ?',
            [eventType, handler.name || 'anonymous']
          );
          
          let subscriberId;
          if (subRows.length === 0) {
            const [insSub] = await writeConn.query(
              'INSERT INTO event_subscribers (event_type, handler_endpoint, is_active) VALUES (?, ?, 1)',
              [eventType, handler.name || 'anonymous']
            );
            subscriberId = insSub.insertId;
          } else {
            subscriberId = subRows[0].subscriber_id;
          }

          // Register event failures entry
          const [existingFailures] = await writeConn.query(
            'SELECT failure_id, retry_count, max_retries FROM event_failures WHERE event_id = ? AND subscriber_id = ?',
            [eventId, subscriberId]
          );

          if (existingFailures.length > 0) {
            const current = existingFailures[0];
            const newRetry = current.retry_count + 1;
            const newStatus = newRetry >= current.max_retries ? 'DEAD_LETTER' : 'RETRYING';
            await writeConn.query(
              'UPDATE event_failures SET retry_count = ?, status = ?, error_message = ? WHERE failure_id = ?',
              [newRetry, newStatus, err.message, current.failure_id]
            );
          } else {
            await writeConn.query(
              'INSERT INTO event_failures (event_id, subscriber_id, error_message, retry_count, max_retries, status) VALUES (?, ?, ?, 1, 3, ?)',
              [eventId, subscriberId, err.message, 'RETRYING']
            );
          }
        } finally {
          writeConn.release();
        }
      }
    }

    const finalStatus = allSuccess ? 'PROCESSED' : 'FAILED';
    const writeConn = await db.getConnection();
    try {
      await writeConn.query('UPDATE events SET status = ? WHERE event_id = ?', [finalStatus, eventId]);
    } finally {
      writeConn.release();
    }
  }

  /**
   * Background service routine to retry processing failed event subscribers.
   */
  async retryFailedEvents() {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT ef.*, e.event_type, e.payload, es.handler_endpoint 
         FROM event_failures ef 
         JOIN events e ON ef.event_id = e.event_id 
         JOIN event_subscribers es ON ef.subscriber_id = es.subscriber_id
         WHERE ef.status = 'RETRYING'`
      );

      for (const r of rows) {
        const handlers = this.subscribers[r.event_type] || [];
        const targetHandler = handlers.find(h => (h.name || 'anonymous') === r.handler_endpoint);

        if (!targetHandler) {
          logger.warn(`[EventBus] Subscriber handler ${r.handler_endpoint} not registered locally for retry`);
          continue;
        }

        const payload = JSON.parse(r.payload);
        
        try {
          await targetHandler(payload);
          // Success: delete from failures
          await conn.query('DELETE FROM event_failures WHERE failure_id = ?', [r.failure_id]);
          // Mark parent event processed if no other failures
          const [otherFailures] = await conn.query(
            'SELECT COUNT(*) as count FROM event_failures WHERE event_id = ?',
            [r.event_id]
          );
          if (otherFailures[0].count === 0) {
            await conn.query('UPDATE events SET status = ? WHERE event_id = ?', ['PROCESSED', r.event_id]);
          }
        } catch (err) {
          const newRetry = r.retry_count + 1;
          const status = newRetry >= r.max_retries ? 'DEAD_LETTER' : 'RETRYING';
          await conn.query(
            'UPDATE event_failures SET retry_count = ?, status = ?, error_message = ? WHERE failure_id = ?',
            [newRetry, status, err.message, r.failure_id]
          );
        }
      }
    } catch (err) {
      logger.error('[EventBus] Failed to process background event retries:', err);
    } finally {
      conn.release();
    }
  }
}

module.exports = new EventBus();
