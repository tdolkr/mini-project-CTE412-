import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import todoRoutes from './routes/todoRoutes';
import habitRoutes from './routes/habitRoutes';
import { authMiddleware } from './middleware/authMiddleware';
import { notFoundHandler, errorHandler } from './middleware/errorHandlers';
import fs from 'fs';
import path from 'path';

const app = express();
const clientDir = path.join(__dirname, '..', 'frontend', 'dist');
const clientIndexPath = path.join(clientDir, 'index.html');

app.use(helmet());
app.use(cors());
app.use(express.json());
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/todos', authMiddleware, todoRoutes);
app.use('/habits', authMiddleware, habitRoutes);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  if (fs.existsSync(clientIndexPath)) {
    return res.sendFile(clientIndexPath);
  }
  return res.status(503).json({
    message: 'Frontend bundle not found. Run `npm run web:build` or start the Vite dev server with `npm run web:dev`.'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
