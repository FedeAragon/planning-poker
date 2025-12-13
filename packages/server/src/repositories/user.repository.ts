import { prisma } from '../lib/prisma';
import type { User, Role } from '@planning-poker/shared';

export interface CreateUserData {
  name: string;
  roomId: string;
  role?: Role;
}

export interface UpdateUserData {
  name?: string;
  connected?: boolean;
  role?: Role;
}

function mapToUser(dbUser: {
  id: string;
  name: string;
  roomId: string;
  connected: boolean;
  role: string;
}): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    roomId: dbUser.roomId,
    connected: dbUser.connected,
    role: dbUser.role as Role,
  };
}

export const userRepository = {
  async create(data: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        roomId: data.roomId,
        role: data.role || 'voter',
        connected: true,
      },
    });
    return mapToUser(user);
  },

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? mapToUser(user) : null;
  },

  async findByRoomId(roomId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { roomId },
      orderBy: { lastConnection: 'asc' },
    });
    return users.map(mapToUser);
  },

  async findConnectedByRoomId(roomId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { roomId, connected: true },
      orderBy: { lastConnection: 'asc' },
    });
    return users.map(mapToUser);
  },

  async findAdminsByRoomId(roomId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        roomId,
        role: { in: ['creator', 'admin'] },
      },
    });
    return users.map(mapToUser);
  },

  async findConnectedVotersByRoomId(roomId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        roomId,
        connected: true,
        role: { in: ['creator', 'admin', 'voter'] },
      },
    });
    return users.map(mapToUser);
  },

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        lastConnection: new Date(),
      },
    });
    return mapToUser(user);
  },

  async setConnected(id: string, connected: boolean): Promise<User | null> {
    return this.update(id, { connected });
  },

  async setRole(id: string, role: Role): Promise<User | null> {
    return this.update(id, { role });
  },

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  },

  async getCreatorByRoomId(roomId: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { roomId, role: 'creator' },
    });
    return user ? mapToUser(user) : null;
  },

  async countConnectedByRoomId(roomId: string): Promise<number> {
    return prisma.user.count({
      where: { roomId, connected: true },
    });
  },
};


