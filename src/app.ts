import 'express-async-errors';
import express from 'express';
import { requestTracker } from './core/middlewares/requestTracker';
import { errorHandler } from './core/middlewares/errorHandler';

const app = express();

// ─── Global Middlewares ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestTracker);

// ─── Health Check ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

import authRouter from './modules/auth/routes';
import patientRouter from './modules/patient/routes';
import doctorRouter from './modules/doctor/routes';
import appointmentRouter from './modules/appointment/routes';
import medicalRecordRouter from './modules/medicalRecord/routes';
import fileRouter from './modules/file/routes';

// ─── API Routes (will be added per module) ───────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/medical-records', medicalRecordRouter);
app.use('/api/v1/files', fileRouter);

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// ─── Error Handler (MUST be last) ────────────────────────────────
app.use(errorHandler);

export default app;
