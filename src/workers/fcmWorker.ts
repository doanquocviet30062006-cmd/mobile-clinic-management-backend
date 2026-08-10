/**
 * ══════════════════════════════════════════════════════════════════
 * FCM BACKGROUND WORKER (Runs as a separate process from API Server)
 * ══════════════════════════════════════════════════════════════════
 * 
 * Start with: npm run worker
 * 
 * This worker:
 * 1. Creates a Consumer Group on Redis Stream (db3)
 * 2. Listens for new notification messages via XREADGROUP (blocking)
 * 3. Calls FCM API to send push notifications
 * 4. Implements Exponential Backoff Retry (1s → 2s → 4s)
 * 5. After 3 failures → moves message to Dead Letter Queue (DLQ)
 * 6. Calls XACK on success or after DLQ push
 */

import 'dotenv/config';
import Redis from 'ioredis';
import { fcmService } from '../core/services/fcmService';
import { dlqHandler } from './dlqHandler';
import { logger } from '../config/logger';

// ─── Configuration ───────────────────────────────────────────────
const STREAM_KEY = 'notifications_stream';
const GROUP_NAME = 'notification_workers';
const CONSUMER_NAME = `worker_${process.pid}`; // Unique per process
const MAX_RETRIES = 3;
const BLOCK_TIMEOUT_MS = 5000; // Block for 5s waiting for new messages

// Dedicated Redis connection for this worker (db3: Streams)
const redisWorker = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: 3,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
});

// ─── Helper: Sleep with Exponential Backoff ──────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getBackoffDelay(attempt: number): number {
  // 1s → 2s → 4s
  return Math.pow(2, attempt) * 1000;
}

// ─── Initialize Consumer Group ───────────────────────────────────
async function initConsumerGroup(): Promise<void> {
  try {
    await redisWorker.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '0', 'MKSTREAM');
    logger.info({ stream: STREAM_KEY, group: GROUP_NAME }, 'Consumer group created');
  } catch (error: any) {
    // BUSYGROUP means the group already exists — this is fine
    if (error.message && error.message.includes('BUSYGROUP')) {
      logger.info({ stream: STREAM_KEY, group: GROUP_NAME }, 'Consumer group already exists');
    } else {
      throw error;
    }
  }
}

// ─── Process a Single Message ────────────────────────────────────
async function processMessage(messageId: string, fields: Record<string, string>): Promise<void> {
  const { notification_id, user_id, type } = fields;

  logger.info({ messageId, notification_id, type }, 'Processing notification message');

  // In a real system, you would look up the user's FCM device token from DB.
  // For now, we use a placeholder token.
  const deviceToken = `fcm_token_for_${user_id}`;

  // Retry loop with Exponential Backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await fcmService.sendPush(deviceToken, {
        notification_id,
        type,
      });

      // ✅ SUCCESS — Acknowledge the message
      await redisWorker.xack(STREAM_KEY, GROUP_NAME, messageId);

      logger.info({ messageId, notification_id, attempt: attempt + 1 }, 'Notification sent and ACKed');
      return; // Done!
    } catch (error: any) {
      const delay = getBackoffDelay(attempt);
      logger.warn({
        messageId,
        notification_id,
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
        nextRetryIn: `${delay}ms`,
        error: error.message,
      }, `FCM call failed. Retrying in ${delay}ms...`);

      if (attempt < MAX_RETRIES - 1) {
        await sleep(delay);
      }
    }
  }

  // ❌ ALL RETRIES EXHAUSTED — Move to Dead Letter Queue
  await dlqHandler.push(messageId, fields, 'Exceeded max retries for FCM push');

  // ACK the original message so it doesn't block the stream
  await redisWorker.xack(STREAM_KEY, GROUP_NAME, messageId);

  logger.error({ messageId, notification_id }, 'Message moved to DLQ after exhausting all retries');
}

// ─── Main Worker Loop ────────────────────────────────────────────
async function startWorker(): Promise<void> {
  logger.info({
    consumer: CONSUMER_NAME,
    stream: STREAM_KEY,
    group: GROUP_NAME,
    pid: process.pid,
  }, '🚀 FCM Background Worker started');

  await initConsumerGroup();

  // Infinite loop: continuously read from the stream
  while (true) {
    try {
      // XREADGROUP: Read new messages assigned to this consumer
      // '>' means only undelivered (new) messages
      const results = await redisWorker.xreadgroup(
        'GROUP', GROUP_NAME, CONSUMER_NAME,
        'COUNT', 10,           // Process up to 10 messages at a time
        'BLOCK', BLOCK_TIMEOUT_MS, // Block for 5s if no messages
        'STREAMS', STREAM_KEY,
        '>'                    // Only new messages
      );

      if (!results) {
        // Timeout with no messages — loop again
        continue;
      }

      // results shape: [ [ streamName, [ [messageId, [field, value, ...]], ... ] ] ]
      for (const [, messages] of results) {
        for (const [messageId, flatFields] of messages) {
          if (!flatFields) continue;
          // Convert flat array [k1, v1, k2, v2] into object { k1: v1, k2: v2 }
          const fields: Record<string, string> = {};
          for (let i = 0; i < flatFields.length; i += 2) {
            fields[flatFields[i]] = flatFields[i + 1];
          }

          await processMessage(messageId, fields);
        }
      }
    } catch (error) {
      logger.error({ error }, 'Worker loop error. Restarting in 3s...');
      await sleep(3000);
    }
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────────
process.on('SIGINT', async () => {
  logger.info('Worker received SIGINT. Shutting down gracefully...');
  await redisWorker.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Worker received SIGTERM. Shutting down gracefully...');
  await redisWorker.quit();
  process.exit(0);
});

// ─── Start ───────────────────────────────────────────────────────
startWorker().catch((error) => {
  logger.error({ error }, 'Fatal error starting worker');
  process.exit(1);
});
