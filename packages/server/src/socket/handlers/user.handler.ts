import type { TypedSocket, TypedServer } from '../types';
import { userService } from '../../services/user.service';

export function registerUserHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('user:register', async ({ name }) => {
    socket.data.userName = name;
  });

  socket.on('user:change_role', async ({ userId, role }) => {
    const requesterId = socket.data.userId;
    const roomId = socket.data.roomId;

    if (!requesterId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const updatedUser = await userService.changeRole(requesterId, userId, role);
      if (!updatedUser) {
        socket.emit('error', { message: 'Not authorized to change role' });
        return;
      }

      io.to(roomId).emit('user:role_changed', { userId, role: updatedUser.role });
    } catch (error) {
      socket.emit('error', { message: 'Failed to change role' });
    }
  });
}

export async function handleDisconnect(io: TypedServer, socket: TypedSocket) {
  const { userId, roomId } = socket.data;

  if (userId && roomId) {
    try {
      // Check if user has other active connections in this room
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const userOtherConnections = socketsInRoom.filter(
        s => s.data.userId === userId && s.id !== socket.id
      );

      // Only disconnect if no other connections
      if (userOtherConnections.length === 0) {
        const result = await userService.disconnect(userId);
        
        if (result.user) {
          socket.to(roomId).emit('user:disconnected', { userId });
        }

        if (result.newAdmin) {
          io.to(roomId).emit('user:role_changed', { 
            userId: result.newAdmin.id, 
            role: result.newAdmin.role 
          });
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }
}


