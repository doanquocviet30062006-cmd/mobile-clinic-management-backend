import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const port = env.PORT;

const server = app.listen(port, () => {
  logger.info(`App is running on port ${port} in ${env.NODE_ENV} mode.`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.fatal(err, 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  logger.fatal(err, 'UNHANDLED REJECTION! 💥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown on SIGTERM (e.g. Docker stop)
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});
