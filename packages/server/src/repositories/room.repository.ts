import { prisma } from '../lib/prisma';
import type { Room, RoomStatus } from '@planning-poker/shared';

export interface CreateRoomData {
  name: string;
}

export interface UpdateRoomData {
  name?: string;
  status?: RoomStatus;
  currentTaskId?: string | null;
}

function mapToRoom(dbRoom: {
  id: string;
  name: string;
  status: string;
  currentTaskId: string | null;
}): Room {
  return {
    id: dbRoom.id,
    name: dbRoom.name,
    status: dbRoom.status as RoomStatus,
    currentTaskId: dbRoom.currentTaskId,
  };
}

export const roomRepository = {
  async create(data: CreateRoomData): Promise<Room> {
    const room = await prisma.room.create({
      data: {
        name: data.name,
        status: 'active',
      },
    });
    return mapToRoom(room);
  },

  async findById(id: string): Promise<Room | null> {
    const room = await prisma.room.findUnique({
      where: { id },
    });
    return room ? mapToRoom(room) : null;
  },

  async update(id: string, data: UpdateRoomData): Promise<Room | null> {
    const room = await prisma.room.update({
      where: { id },
      data,
    });
    return mapToRoom(room);
  },

  async delete(id: string): Promise<void> {
    await prisma.room.delete({
      where: { id },
    });
  },

  async setCurrentTask(roomId: string, taskId: string | null): Promise<Room | null> {
    return this.update(roomId, { currentTaskId: taskId });
  },

  async finish(roomId: string): Promise<Room | null> {
    return this.update(roomId, { status: 'finished', currentTaskId: null });
  },
};


