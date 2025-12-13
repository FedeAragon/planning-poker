import { voteRepository } from '../repositories/vote.repository';
import { taskRepository } from '../repositories/task.repository';
import { userRepository } from '../repositories/user.repository';
import { roomRepository } from '../repositories/room.repository';
import type { Vote, VoteValue } from '@planning-poker/shared';
import { VOTE_VALUES } from '@planning-poker/shared';

export interface RevealResult {
  votes: Vote[];
  finalEstimate: number;
  percentages: Record<number, number>;
  allVoted: boolean;
}

export interface SubmitVoteResult {
  vote: Vote;
  allVoted: boolean;
  wasUpdate: boolean;
  alreadyRevealed: boolean;
}

export const voteService = {
  async submit(taskId: string, userId: string, value: VoteValue): Promise<SubmitVoteResult | null> {
    const task = await taskRepository.findById(taskId);
    if (!task) return null;
    if (task.status !== 'voting') return null;

    const user = await userRepository.findById(userId);
    if (!user) return null;
    if (user.role === 'observer') return null;

    // Check if user already had a vote
    const existingVote = await voteRepository.findByTaskAndUser(taskId, userId);
    const wasUpdate = !!existingVote;

    // Check if votes were already revealed (more than one vote exists = likely revealed)
    const existingVotes = await voteRepository.findByTaskId(taskId);
    const alreadyRevealed = existingVotes.length > 0 && wasUpdate;

    const vote = await voteRepository.upsert({ taskId, userId, value });
    const allVoted = await this.checkAllVoted(taskId, task.roomId);

    return { vote, allVoted, wasUpdate, alreadyRevealed };
  },

  async checkAllVoted(taskId: string, roomId: string): Promise<boolean> {
    const connectedVoters = await userRepository.findConnectedVotersByRoomId(roomId);
    const votedUserIds = await voteRepository.getUserIdsWhoVoted(taskId);

    // Need at least 1 connected voter and votes count must match
    if (connectedVoters.length === 0) return false;
    if (votedUserIds.length < connectedVoters.length) return false;
    
    return connectedVoters.every(user => votedUserIds.includes(user.id));
  },

  async reveal(taskId: string, userId: string): Promise<RevealResult | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;
    if (user.role !== 'creator' && user.role !== 'admin') return null;

    return this.recalculate(taskId);
  },

  // Recalculate votes without permission check (for post-reveal vote changes)
  async recalculate(taskId: string): Promise<RevealResult | null> {
    const task = await taskRepository.findById(taskId);
    if (!task) return null;

    const votes = await voteRepository.findByTaskId(taskId);
    const distribution = await voteRepository.getVoteDistribution(taskId);

    // Calculate percentages
    const totalVotes = votes.length;
    const percentages: Record<number, number> = {};
    
    for (const value of VOTE_VALUES) {
      const count = distribution[value] || 0;
      if (count > 0) {
        percentages[value] = Math.round((count / totalVotes) * 100);
      }
    }

    // Find the most voted value (highest value wins ties)
    let maxCount = 0;
    let finalEstimate = 0;
    
    for (const value of VOTE_VALUES) {
      const count = distribution[value] || 0;
      if (count > maxCount || (count === maxCount && value > finalEstimate)) {
        maxCount = count;
        finalEstimate = value;
      }
    }

    const allVoted = await this.checkAllVoted(taskId, task.roomId);

    return { votes, finalEstimate, percentages, allVoted };
  },

  async next(taskId: string, userId: string): Promise<{ previousTask: { id: string; duration: number }; nextTask: string | null } | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;
    if (user.role !== 'creator' && user.role !== 'admin') return null;

    const task = await taskRepository.findById(taskId);
    if (!task || !task.votingStartedAt) return null;

    // Calculate duration
    const now = new Date();
    const durationSeconds = Math.floor(
      (now.getTime() - new Date(task.votingStartedAt).getTime()) / 1000
    );

    // Get final estimate from votes
    const distribution = await voteRepository.getVoteDistribution(taskId);
    let maxCount = 0;
    let finalEstimate = 0;
    
    for (const value of VOTE_VALUES) {
      const count = distribution[value] || 0;
      if (count > maxCount || (count === maxCount && value > finalEstimate)) {
        maxCount = count;
        finalEstimate = value;
      }
    }

    // Finish current task
    await taskRepository.finishVoting(taskId, finalEstimate, durationSeconds);

    // Find next pending task
    const pendingTasks = await taskRepository.findPendingByRoomId(task.roomId);
    let nextTaskId: string | null = null;

    if (pendingTasks.length > 0) {
      const nextTask = pendingTasks[0];
      await taskRepository.startVoting(nextTask.id);
      await roomRepository.setCurrentTask(task.roomId, nextTask.id);
      nextTaskId = nextTask.id;
    } else {
      await roomRepository.setCurrentTask(task.roomId, null);
    }

    return {
      previousTask: { id: taskId, duration: durationSeconds },
      nextTask: nextTaskId,
    };
  },

  async reset(taskId: string, userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) return false;
    if (user.role !== 'creator' && user.role !== 'admin') return false;

    const task = await taskRepository.findById(taskId);
    if (!task) return false;

    // Delete all votes for this task
    await voteRepository.deleteByTaskId(taskId);

    // Reset task to voting state with new timer
    await taskRepository.resetVoting(taskId);

    return true;
  },

  async getVotesForTask(taskId: string): Promise<Vote[]> {
    return voteRepository.findByTaskId(taskId);
  },

  async getUsersWhoVoted(taskId: string): Promise<string[]> {
    return voteRepository.getUserIdsWhoVoted(taskId);
  },
};


