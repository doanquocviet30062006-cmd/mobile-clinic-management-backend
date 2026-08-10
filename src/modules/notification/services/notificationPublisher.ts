import { redisStream } from '../../../config/redis';
import { db } from '../../../config/database';
import { sql } from 'kysely';
import { logger } from '../../../config/logger';

const STREAM_KEY = 'notifications_stream';

interface NotificationPayload {
  userId: string;
  type: string;       // e.g., 'APPOINTMENT_BOOKED'
  title: string;
  body: string;
  entityType?: string; // e.g., 'appointment'
  entityId?: string;
}

export class NotificationPublisher {
  /**
   * Save notification to DB and publish to Redis Stream (db3).
   * 
   * SECURITY: Only the notification_id is published to the stream.
   * No clinical/PII data goes into the push payload.
   */
  async send(payload: NotificationPayload): Promise<void> {
    try {
      // 1. Persist notification in DB
      const result = await sql`
        INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
        VALUES (${payload.userId}, ${payload.type}, ${payload.title}, ${payload.body}, ${payload.entityType || null}, ${payload.entityId || null})
        RETURNING id
      `.execute(db);

      const notificationId = (result.rows[0] as any).id;

      // 2. Publish ONLY the notification_id + user_id to Redis Stream
      // This ensures no sensitive medical data leaks into push notifications
      await redisStream.xadd(
        STREAM_KEY,
        '*', // Auto-generate message ID
        'notification_id', notificationId,
        'user_id', payload.userId,
        'type', payload.type,
      );

      logger.info({
        notificationId,
        userId: payload.userId,
        type: payload.type,
      }, 'Notification published to Redis Stream');

    } catch (error) {
      // Notification failures must NOT crash the main API flow
      logger.error({ error, payload: { userId: payload.userId, type: payload.type } },
        'Failed to publish notification (non-blocking)');
    }
  }
}

export const notificationPublisher = new NotificationPublisher();
