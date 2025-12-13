import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@planning-poker/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    
    if (s.connected) {
      resolve();
      return;
    }

    s.on('connect', () => {
      console.log('✅ Connected to server');
      resolve();
    });

    s.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      reject(error);
    });

    s.connect();
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}


