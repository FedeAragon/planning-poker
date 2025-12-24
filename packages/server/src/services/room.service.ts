import { roomRepository } from '../repositories/room.repository';
import { userRepository } from '../repositories/user.repository';
import { taskRepository } from '../repositories/task.repository';
import { voteRepository } from '../repositories/vote.repository';
import type { Room, User, Task, Vote, RoomState } from '@planning-poker/shared';

export interface CreateRoomResult {
  room: Room;
  user: User;
}

export interface JoinRoomResult {
  state: RoomState;
  user: User;
}

export interface RejoinRoomResult {
  state: RoomState;
  user: User;
  wasDisconnected: boolean;
}

export const roomService = {
  async create(roomName: string, userName: string): Promise<CreateRoomResult> {
    const room = await roomRepository.create({ name: roomName });
    const user = await userRepository.create({
      name: userName,
      roomId: room.id,
      role: 'creator',
    });
    return { room, user };
  },

  async join(roomId: string, userName: string): Promise<JoinRoomResult | null> {
    const room = await roomRepository.findById(roomId);
    if (!room) return null;

    const user = await userRepository.create({
      name: userName,
      roomId: room.id,
      role: 'voter',
    });

    const state = await this.getRoomState(roomId);
    if (!state) return null;

    return { state, user };
  },

  async rejoin(roomId: string, userId: string): Promise<RejoinRoomResult | null> {
    const room = await roomRepository.findById(roomId);
    if (!room) return null;

    const user = await userRepository.findById(userId);
    if (!user || user.roomId !== roomId) return null;

    // Check if user was disconnected BEFORE marking as connected
    const wasDisconnected = !user.connected;

    // Mark user as connected
    await userRepository.setConnected(userId, true);
    const updatedUser = await userRepository.findById(userId);
    if (!updatedUser) return null;

    const state = await this.getRoomState(roomId);
    if (!state) return null;

    return { state, user: updatedUser, wasDisconnected };
  },

  async getRoomState(roomId: string): Promise<RoomState | null> {
    const room = await roomRepository.findById(roomId);
    if (!room) return null;

    const users = await userRepository.findByRoomId(roomId);
    const tasks = await taskRepository.findByRoomId(roomId);
    
    const currentTask = tasks.find(t => t.status === 'voting');
    const votes = currentTask 
      ? await voteRepository.findByTaskId(currentTask.id)
      : [];
    
    const votedUserIds = currentTask
      ? await voteRepository.getUserIdsWhoVoted(currentTask.id)
      : [];

    return { room, users, tasks, votes, votedUserIds };
  },

  async finish(roomId: string, userId: string): Promise<Room | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;
    if (user.role !== 'creator' && user.role !== 'admin') return null;

    return roomRepository.finish(roomId);
  },

  async exists(roomId: string): Promise<boolean> {
    const room = await roomRepository.findById(roomId);
    return room !== null;
  },

  async isActive(roomId: string): Promise<boolean> {
    const room = await roomRepository.findById(roomId);
    return room?.status === 'active';
  },
};

