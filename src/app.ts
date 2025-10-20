import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import { authMiddleware } from './middleware/authMiddleware';
import { notFoundHandler, errorHandler } from './middleware/errorHandlers';

const app = express();
const publicDir = path.join(__dirname, '..', 'public');

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/tasks', authMiddleware, taskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
