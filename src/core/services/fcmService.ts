import { logger } from '../../config/logger';

/**
 * Firebase Cloud Messaging Service Wrapper.
 * 
 * In production, this would use `firebase-admin` SDK.
 * For now, this is a structured placeholder that logs the call.
 * Replace the `sendPush` method body with real FCM logic when ready.
 */
export class FCMService {
  /**
   * Send a Data Message via Firebase Cloud Messaging.
   * 
   * SECURITY CONSTRAINT:
   * The payload MUST NOT contain any medical/PII data.
   * Only send the notification_id so the mobile app can fetch details securely via API.
   */
  async sendPush(deviceToken: string, data: Record<string, string>): Promise<void> {
    // ─── Production Implementation ───────────────────────────────
    // import admin from 'firebase-admin';
    // await admin.messaging().send({
    //   token: deviceToken,
    //   data: data,  // { notification_id: '...', type: 'APPOINTMENT_BOOKED' }
    // });

    // ─── Development Placeholder ─────────────────────────────────
    logger.info({
      deviceToken: deviceToken.substring(0, 8) + '***',
      dataKeys: Object.keys(data),
    }, '[FCM] Push notification sent (dev mode)');
  }
}

export const fcmService = new FCMService();
