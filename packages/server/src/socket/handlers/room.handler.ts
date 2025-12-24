import type { TypedSocket, TypedServer } from '../types';
import { roomService } from '../../services/room.service';
import { taskService } from '../../services/task.service';
import { voteService } from '../../services/vote.service';

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('room:create', async ({ name }) => {
    const userName = socket.data.userName;
    if (!userName) {
      socket.emit('error', { message: 'User not registered' });
      return;
    }

    try {
      const result = await roomService.create(name, userName);
      
      socket.data.userId = result.user.id;
      socket.data.roomId = result.room.id;
      
      await socket.join(result.room.id);
      
      socket.emit('room:created', { room: result.room });
      socket.emit('user:registered', { user: result.user });
      
      const state = await roomService.getRoomState(result.room.id);
      if (state) {
        socket.emit('room:joined', state);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('room:join', async ({ roomId }) => {
    const userName = socket.data.userName;
    if (!userName) {
      socket.emit('error', { message: 'User not registered' });
      return;
    }

    try {
      const result = await roomService.join(roomId, userName);
      if (!result) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.data.userId = result.user.id;
      socket.data.roomId = roomId;

      await socket.join(roomId);

      socket.emit('user:registered', { user: result.user });
      socket.emit('room:joined', result.state);

      socket.to(roomId).emit('room:user_joined', { user: result.user });
      socket.to(roomId).emit('user:connected', { user: result.user });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('room:rejoin', async ({ roomId, userId }) => {
    try {
      const result = await roomService.rejoin(roomId, userId);
      if (!result) {
        socket.emit('error', { message: 'Session expired or invalid' });
        return;
      }

      socket.data.userId = result.user.id;
      socket.data.roomId = roomId;
      socket.data.userName = result.user.name;

      await socket.join(roomId);

      socket.emit('user:reconnected', { 
        user: result.user,
        ...result.state 
      });

      // Only notify others if user was previously disconnected
      if (result.wasDisconnected) {
        socket.to(roomId).emit('user:connected', { user: result.user });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to rejoin room' });
    }
  });

  socket.on('room:finish', async () => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const room = await roomService.finish(roomId, userId);
      if (!room) {
        socket.emit('error', { message: 'Not authorized or room not found' });
        return;
      }

      io.to(roomId).emit('room:updated', { room });
    } catch (error) {
      socket.emit('error', { message: 'Failed to finish room' });
    }
  });
}

