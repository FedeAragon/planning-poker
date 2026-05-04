import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app';
import { initializeSocket } from './socket';

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const MEMORY_LOG_INTERVAL_MS = 60_000; // cada 1 minuto

setInterval(() => {
  const mem = process.memoryUsage();
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
  console.log(
    `[memory] rss=${toMB(mem.rss)}MB heapUsed=${toMB(mem.heapUsed)}MB heapTotal=${toMB(mem.heapTotal)}MB external=${toMB(mem.external)}MB`
  );
}, MEMORY_LOG_INTERVAL_MS).unref();

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

