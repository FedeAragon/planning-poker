import { prisma } from '../lib/prisma';
import type { Task, TaskStatus } from '@planning-poker/shared';

export interface CreateTaskData {
  roomId: string;
  title: string;
  order: number;
}

export interface UpdateTaskData {
  title?: string;
  order?: number;
  status?: TaskStatus;
  finalEstimate?: number | null;
  votingStartedAt?: Date | null;
  votingDurationSeconds?: number | null;
}

function mapToTask(dbTask: {
  id: string;
  roomId: string;
  title: string;
  order: number;
  status: string;
  finalEstimate: number | null;
  votingStartedAt: Date | null;
  votingDurationSeconds: number | null;
}): Task {
  return {
    id: dbTask.id,
    roomId: dbTask.roomId,
    title: dbTask.title,
    order: dbTask.order,
    status: dbTask.status as TaskStatus,
    finalEstimate: dbTask.finalEstimate,
    votingStartedAt: dbTask.votingStartedAt,
    votingDurationSeconds: dbTask.votingDurationSeconds,
  };
}

export const taskRepository = {
  async create(data: CreateTaskData): Promise<Task> {
    const task = await prisma.task.create({
      data: {
        roomId: data.roomId,
        title: data.title,
        order: data.order,
        status: 'pending',
      },
    });
    return mapToTask(task);
  },

  async createMany(tasks: CreateTaskData[]): Promise<Task[]> {
    await prisma.task.createMany({
      data: tasks.map((t) => ({
        roomId: t.roomId,
        title: t.title,
        order: t.order,
        status: 'pending',
      })),
    });
    
    const roomId = tasks[0]?.roomId;
    if (!roomId) return [];
    
    return this.findByRoomId(roomId);
  },

  async findById(id: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
    });
    return task ? mapToTask(task) : null;
  },

  async findByRoomId(roomId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { roomId },
      orderBy: { order: 'asc' },
    });
    return tasks.map(mapToTask);
  },

  async findPendingByRoomId(roomId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { roomId, status: 'pending' },
      orderBy: { order: 'asc' },
    });
    return tasks.map(mapToTask);
  },

  async findVotedByRoomId(roomId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { roomId, status: 'voted' },
      orderBy: { order: 'asc' },
    });
    return tasks.map(mapToTask);
  },

  async findCurrentByRoomId(roomId: string): Promise<Task | null> {
    const task = await prisma.task.findFirst({
      where: { roomId, status: 'voting' },
    });
    return task ? mapToTask(task) : null;
  },

  async update(id: string, data: UpdateTaskData): Promise<Task | null> {
    const task = await prisma.task.update({
      where: { id },
      data,
    });
    return mapToTask(task);
  },

  async startVoting(id: string): Promise<Task | null> {
    return this.update(id, {
      status: 'voting',
      votingStartedAt: new Date(),
      votingDurationSeconds: null,
    });
  },

  async finishVoting(id: string, finalEstimate: number, durationSeconds: number): Promise<Task | null> {
    return this.update(id, {
      status: 'voted',
      finalEstimate,
      votingDurationSeconds: durationSeconds,
    });
  },

  async resetVoting(id: string): Promise<Task | null> {
    return this.update(id, {
      status: 'voting',
      votingStartedAt: new Date(),
      finalEstimate: null,
      votingDurationSeconds: null,
    });
  },

  async updateOrder(id: string, newOrder: number): Promise<Task | null> {
    return this.update(id, { order: newOrder });
  },

  async getMaxOrder(roomId: string): Promise<number> {
    const result = await prisma.task.aggregate({
      where: { roomId },
      _max: { order: true },
    });
    return result._max.order ?? -1;
  },

  async delete(id: string): Promise<void> {
    await prisma.task.delete({
      where: { id },
    });
  },

  async getTop3Slowest(roomId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        roomId,
        status: 'voted',
        votingDurationSeconds: { not: null },
      },
      orderBy: { votingDurationSeconds: 'desc' },
      take: 3,
    });
    return tasks.map(mapToTask);
  },
};


