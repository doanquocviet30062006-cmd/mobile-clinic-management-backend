import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Redact sensitive fields - NEVER log PII
  redact: {
    paths: [
      'password',
      'token',
      'refreshToken',
      'refresh_token',
      'accessToken',
      'access_token',
      'id_card',
      'phone',
      'req.headers.authorization',
      'req.body.password',
      'req.body.token',
    ],
    censor: '[REDACTED]',
  },

  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
