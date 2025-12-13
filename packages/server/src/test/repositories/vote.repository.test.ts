import { describe, it, expect, beforeEach } from 'vitest';
import { voteRepository } from '../../repositories/vote.repository';
import { taskRepository } from '../../repositories/task.repository';
import { userRepository } from '../../repositories/user.repository';
import { roomRepository } from '../../repositories/room.repository';

describe('VoteRepository', () => {
  let roomId: string;
  let taskId: string;
  let userId: string;

  beforeEach(async () => {
    const room = await roomRepository.create({ name: 'Test Room' });
    roomId = room.id;
    
    const task = await taskRepository.create({ roomId, title: 'Test Task', order: 0 });
    taskId = task.id;
    
    const user = await userRepository.create({ name: 'Test User', roomId });
    userId = user.id;
  });

  describe('upsert', () => {
    it('should create a new vote', async () => {
      const vote = await voteRepository.upsert({ taskId, userId, value: 5 });

      expect(vote).toBeDefined();
      expect(vote.taskId).toBe(taskId);
      expect(vote.userId).toBe(userId);
      expect(vote.value).toBe(5);
    });

    it('should update existing vote', async () => {
      await voteRepository.upsert({ taskId, userId, value: 3 });
      const updated = await voteRepository.upsert({ taskId, userId, value: 8 });

      expect(updated.value).toBe(8);

      const votes = await voteRepository.findByTaskId(taskId);
      expect(votes).toHaveLength(1);
    });
  });

  describe('findByTaskId', () => {
    it('should find all votes for a task', async () => {
      const user2 = await userRepository.create({ name: 'User 2', roomId });
      
      await voteRepository.upsert({ taskId, userId, value: 3 });
      await voteRepository.upsert({ taskId, userId: user2.id, value: 5 });

      const votes = await voteRepository.findByTaskId(taskId);

      expect(votes).toHaveLength(2);
    });
  });

  describe('findByTaskAndUser', () => {
    it('should find vote by task and user', async () => {
      await voteRepository.upsert({ taskId, userId, value: 5 });

      const vote = await voteRepository.findByTaskAndUser(taskId, userId);

      expect(vote?.value).toBe(5);
    });

    it('should return null if no vote exists', async () => {
      const vote = await voteRepository.findByTaskAndUser(taskId, userId);
      expect(vote).toBeNull();
    });
  });

  describe('countByTaskId', () => {
    it('should count votes for task', async () => {
      const user2 = await userRepository.create({ name: 'User 2', roomId });
      
      await voteRepository.upsert({ taskId, userId, value: 3 });
      await voteRepository.upsert({ taskId, userId: user2.id, value: 5 });

      const count = await voteRepository.countByTaskId(taskId);

      expect(count).toBe(2);
    });
  });

  describe('deleteByTaskId', () => {
    it('should delete all votes for task', async () => {
      const user2 = await userRepository.create({ name: 'User 2', roomId });
      
      await voteRepository.upsert({ taskId, userId, value: 3 });
      await voteRepository.upsert({ taskId, userId: user2.id, value: 5 });

      await voteRepository.deleteByTaskId(taskId);

      const votes = await voteRepository.findByTaskId(taskId);
      expect(votes).toHaveLength(0);
    });
  });

  describe('getVoteDistribution', () => {
    it('should return vote distribution', async () => {
      const user2 = await userRepository.create({ name: 'User 2', roomId });
      const user3 = await userRepository.create({ name: 'User 3', roomId });
      
      await voteRepository.upsert({ taskId, userId, value: 5 });
      await voteRepository.upsert({ taskId, userId: user2.id, value: 5 });
      await voteRepository.upsert({ taskId, userId: user3.id, value: 3 });

      const distribution = await voteRepository.getVoteDistribution(taskId);

      expect(distribution[5]).toBe(2);
      expect(distribution[3]).toBe(1);
    });
  });

  describe('getUserIdsWhoVoted', () => {
    it('should return user ids who voted', async () => {
      const user2 = await userRepository.create({ name: 'User 2', roomId });
      
      await voteRepository.upsert({ taskId, userId, value: 3 });
      await voteRepository.upsert({ taskId, userId: user2.id, value: 5 });

      const userIds = await voteRepository.getUserIdsWhoVoted(taskId);

      expect(userIds).toHaveLength(2);
      expect(userIds).toContain(userId);
      expect(userIds).toContain(user2.id);
    });
  });
});


