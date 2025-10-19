import { createServer } from 'http';
import app from './app';
import { env } from './utils/env';
import { logger } from './utils/logger';

const port = Number(env.PORT) || 3000;

const server = createServer(app);

server.listen(port, () => {
  logger.info(`API listening on port ${port}`);
});
