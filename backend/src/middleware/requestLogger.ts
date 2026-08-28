import morgan from 'morgan';
import { logger } from '../utils/logger';

// Create stream for morgan to forward logs to our custom logger
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const requestLogger = morgan(
  ':remote-addr - :method :url HTTP/:http-version :status :response-time ms - :res[content-length]',
  { stream }
);
