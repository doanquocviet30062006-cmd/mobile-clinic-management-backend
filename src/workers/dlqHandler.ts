import { redisStream } from '../config/redis';
import { logger } from '../config/logger';

const DLQ_STREAM = 'notifications_dlq';

/**
 * Dead Letter Queue Handler.
 * 
 * When a notification fails after all retry attempts,
 * the message is moved here for manual investigation by DevOps/Admin.
 */
export class DLQHandler {
  /**
   * Push a failed message into the Dead Letter Queue stream.
   */
  async push(originalMessageId: string, data: Record<string, string>, errorMessage: string): Promise<void> {
    try {
      await redisStream.xadd(
        DLQ_STREAM,
        '*',
        'original_message_id', originalMessageId,
        'notification_id', data.notification_id || 'unknown',
        'user_id', data.user_id || 'unknown',
        'type', data.type || 'unknown',
        'error', errorMessage,
        'failed_at', new Date().toISOString(),
      );

      logger.warn({
        originalMessageId,
        notificationId: data.notification_id,
        error: errorMessage,
      }, 'Message moved to Dead Letter Queue after exhausting all retries');
    } catch (dlqError) {
      // If even DLQ fails, we absolutely must log it
      logger.error({
        originalMessageId,
        dlqError,
      }, 'CRITICAL: Failed to push message to DLQ');
    }
  }
}

export const dlqHandler = new DLQHandler();
