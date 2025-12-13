import type { Socket, Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@planning-poker/shared';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export interface SocketData {
  userId?: string;
  userName?: string;
  roomId?: string;
}


