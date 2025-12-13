import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@planning-poker/shared';
import type { SocketData } from './types';
import { 
  registerRoomHandlers, 
  registerUserHandlers, 
  registerTaskHandlers, 
  registerVoteHandlers,
  handleDisconnect 
} from './handlers';

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Register all event handlers
    registerUserHandlers(io, socket);
    registerRoomHandlers(io, socket);
    registerTaskHandlers(io, socket);
    registerVoteHandlers(io, socket);

    socket.on('disconnect', async () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      await handleDisconnect(io, socket);
    });
  });

  return io;
}
