import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import authRoutes     from './modules/auth/auth.routes.js';
import userRoutes     from './modules/users/users.routes.js';
import courierRoutes  from './modules/couriers/couriers.routes.js';
import deliveryRoutes from './modules/deliveries/deliveries.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  if (!env.isProd) app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use('/api/auth',       authRoutes);
  app.use('/api/users',      userRoutes);
  app.use('/api/couriers',   courierRoutes);
  app.use('/api/deliveries', deliveryRoutes);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.join(__dirname, '../client');

app.use(express.static(clientPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

  app.use(notFound);
  app.use(errorHandler);

  return app;
}