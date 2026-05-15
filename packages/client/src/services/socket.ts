import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@planning-poker/shared';

const CONNECT_TIMEOUT_MS = 3000;

function parseServerUrls(): string[] {
  const list = import.meta.env.VITE_SERVER_URLS as string | undefined;
  const single = import.meta.env.VITE_SERVER_URL as string | undefined;
  const raw = list ?? single ?? 'http://localhost:3001';
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
}

const SERVER_URLS = parseServerUrls();

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;
let activeUrlIndex = 0;

function createSocket(url: string): TypedSocket {
  return io(url, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    timeout: CONNECT_TIMEOUT_MS,
    reconnectionAttempts: 3,
  });
}

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = createSocket(SERVER_URLS[activeUrlIndex]);
  }
  return socket;
}

function tryConnect(url: string): Promise<TypedSocket> {
  return new Promise((resolve, reject) => {
    const s = createSocket(url);

    const cleanup = () => {
      s.off('connect', onConnect);
      s.off('connect_error', onError);
    };

    const onConnect = () => {
      cleanup();
      resolve(s);
    };

    const onError = (error: Error) => {
      cleanup();
      s.disconnect();
      reject(error);
    };

    s.once('connect', onConnect);
    s.once('connect_error', onError);
    s.connect();
  });
}

export async function connectSocket(): Promise<void> {
  if (socket?.connected) return;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  let lastError: unknown = null;
  for (let i = 0; i < SERVER_URLS.length; i++) {
    const url = SERVER_URLS[i];
    try {
      const connected = await tryConnect(url);
      socket = connected;
      activeUrlIndex = i;
      console.log(`✅ Connected to server: ${url}`);
      return;
    } catch (error) {
      console.warn(`❌ Failed to connect to ${url}:`, error);
      lastError = error;
    }
  }

  throw lastError ?? new Error('No server URLs available');
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}
