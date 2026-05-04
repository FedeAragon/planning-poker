import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app';
import { initializeSocket } from './socket';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

