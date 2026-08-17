import express from 'express';
import 'express-async-errors';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './utils/AppError';

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup simple health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// TODO: Mount routers from modules here
// app.use('/api/v1/patient-identity', patientIdentityRouter);
// app.use('/api/v1/appointment', appointmentRouter);
// ...

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
app.use(errorHandler);

export default app;
