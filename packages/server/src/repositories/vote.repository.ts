import { prisma } from '../lib/prisma';
import type { Vote, VoteValue } from '@planning-poker/shared';

export interface CreateVoteData {
  taskId: string;
  userId: string;
  value: VoteValue;
}

function mapToVote(dbVote: {
  id: string;
  taskId: string;
  userId: string;
  value: number;
}): Vote {
  return {
    id: dbVote.id,
    taskId: dbVote.taskId,
    userId: dbVote.userId,
    value: dbVote.value as VoteValue,
  };
}

export const voteRepository = {
  async upsert(data: CreateVoteData): Promise<Vote> {
    const vote = await prisma.vote.upsert({
      where: {
        taskId_userId: {
          taskId: data.taskId,
          userId: data.userId,
        },
      },
      update: {
        value: data.value,
      },
      create: {
        taskId: data.taskId,
        userId: data.userId,
        value: data.value,
      },
    });
    return mapToVote(vote);
  },

  async findById(id: string): Promise<Vote | null> {
    const vote = await prisma.vote.findUnique({
      where: { id },
    });
    return vote ? mapToVote(vote) : null;
  },

  async findByTaskId(taskId: string): Promise<Vote[]> {
    const votes = await prisma.vote.findMany({
      where: { taskId },
    });
    return votes.map(mapToVote);
  },

  async findByTaskAndUser(taskId: string, userId: string): Promise<Vote | null> {
    const vote = await prisma.vote.findUnique({
      where: {
        taskId_userId: { taskId, userId },
      },
    });
    return vote ? mapToVote(vote) : null;
  },

  async countByTaskId(taskId: string): Promise<number> {
    return prisma.vote.count({
      where: { taskId },
    });
  },

  async deleteByTaskId(taskId: string): Promise<void> {
    await prisma.vote.deleteMany({
      where: { taskId },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.vote.delete({
      where: { id },
    });
  },

  async getVoteDistribution(taskId: string): Promise<Record<number, number>> {
    const votes = await prisma.vote.findMany({
      where: { taskId },
      select: { value: true },
    });

    const distribution: Record<number, number> = {};
    for (const vote of votes) {
      distribution[vote.value] = (distribution[vote.value] || 0) + 1;
    }
    return distribution;
  },

  async getUserIdsWhoVoted(taskId: string): Promise<string[]> {
    const votes = await prisma.vote.findMany({
      where: { taskId },
      select: { userId: true },
    });
    return votes.map((v) => v.userId);
  },
};


