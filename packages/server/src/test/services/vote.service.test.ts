import { describe, it, expect } from 'vitest';
import { voteService } from '../../services/vote.service';
import { taskService } from '../../services/task.service';
import { roomService } from '../../services/room.service';
import { userRepository } from '../../repositories/user.repository';

describe('VoteService', () => {
  describe('submit', () => {
    it('should submit vote for voting task', async () => {
      const { room, user } = await roomService.create('Test', 'Creator');
      const task = await taskService.add(room.id, 'Task 1');

      const result = await voteService.submit(task.id, user.id, 5);

      expect(result).not.toBeNull();
      expect(result?.vote.value).toBe(5);
      expect(result?.vote.userId).toBe(user.id);
    });

    it('should return allVoted true when all connected voters voted', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Voter');
      const task = await taskService.add(room.id, 'Task 1');

      await voteService.submit(task.id, creator.id, 3);
      const result = await voteService.submit(task.id, joinResult!.user.id, 5);

      expect(result?.allVoted).toBe(true);
    });

    it('should not count observer votes for allVoted', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Observer');
      await userRepository.setRole(joinResult!.user.id, 'observer');
      const task = await taskService.add(room.id, 'Task 1');

      const result = await voteService.submit(task.id, creator.id, 3);

      expect(result?.allVoted).toBe(true);
    });

    it('should not allow observer to vote', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Observer');
      await userRepository.setRole(joinResult!.user.id, 'observer');
      const task = await taskService.add(room.id, 'Task 1');

      const result = await voteService.submit(task.id, joinResult!.user.id, 5);

      expect(result).toBeNull();
    });

    it('should allow changing vote', async () => {
      const { room, user } = await roomService.create('Test', 'Creator');
      const task = await taskService.add(room.id, 'Task 1');

      await voteService.submit(task.id, user.id, 3);
      const result = await voteService.submit(task.id, user.id, 8);

      expect(result?.vote.value).toBe(8);

      const votes = await voteService.getVotesForTask(task.id);
      expect(votes).toHaveLength(1);
    });
  });

  describe('reveal', () => {
    it('should reveal votes and calculate percentages', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const voter1 = await roomService.join(room.id, 'Voter1');
      const voter2 = await roomService.join(room.id, 'Voter2');
      const task = await taskService.add(room.id, 'Task 1');

      await voteService.submit(task.id, creator.id, 5);
      await voteService.submit(task.id, voter1!.user.id, 5);
      await voteService.submit(task.id, voter2!.user.id, 3);

      const result = await voteService.reveal(task.id, creator.id);

      expect(result?.votes).toHaveLength(3);
      expect(result?.finalEstimate).toBe(5);
      expect(result?.percentages[5]).toBe(67);
      expect(result?.percentages[3]).toBe(33);
    });

    it('should return highest value on tie', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const voter1 = await roomService.join(room.id, 'Voter1');
      const task = await taskService.add(room.id, 'Task 1');

      await voteService.submit(task.id, creator.id, 3);
      await voteService.submit(task.id, voter1!.user.id, 5);

      const result = await voteService.reveal(task.id, creator.id);

      expect(result?.finalEstimate).toBe(5);
    });

    it('should not allow voter to reveal', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const voter = await roomService.join(room.id, 'Voter');
      const task = await taskService.add(room.id, 'Task 1');

      const result = await voteService.reveal(task.id, voter!.user.id);

      expect(result).toBeNull();
    });
  });

  describe('next', () => {
    it('should finish current task and start next', async () => {
      const { room, user } = await roomService.create('Test', 'Creator');
      await taskService.addBulk(room.id, ['Task 1', 'Task 2']);
      const tasks = await taskService.findByRoomId(room.id);
      const task1 = tasks.find(t => t.title === 'Task 1')!;
      const task2 = tasks.find(t => t.title === 'Task 2')!;

      await voteService.submit(task1.id, user.id, 5);

      const result = await voteService.next(task1.id, user.id);

      expect(result?.previousTask.id).toBe(task1.id);
      expect(result?.previousTask.duration).toBeGreaterThanOrEqual(0);
      expect(result?.nextTask).toBe(task2.id);

      const updatedTask2 = await taskService.findCurrentByRoomId(room.id);
      expect(updatedTask2?.id).toBe(task2.id);
      expect(updatedTask2?.status).toBe('voting');
    });

    it('should return null nextTask when no more pending tasks', async () => {
      const { room, user } = await roomService.create('Test', 'Creator');
      const task = await taskService.add(room.id, 'Only Task');

      await voteService.submit(task.id, user.id, 5);
      const result = await voteService.next(task.id, user.id);

      expect(result?.nextTask).toBeNull();
    });

    it('should not allow voter to advance', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const voter = await roomService.join(room.id, 'Voter');
      const task = await taskService.add(room.id, 'Task');

      const result = await voteService.next(task.id, voter!.user.id);

      expect(result).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset votes and restart timer', async () => {
      const { room, user } = await roomService.create('Test', 'Creator');
      const task = await taskService.add(room.id, 'Task 1');

      await voteService.submit(task.id, user.id, 5);
      const resetResult = await voteService.reset(task.id, user.id);

      expect(resetResult).toBe(true);

      const votes = await voteService.getVotesForTask(task.id);
      expect(votes).toHaveLength(0);

      const updatedTask = await taskService.findCurrentByRoomId(room.id);
      expect(updatedTask?.status).toBe('voting');
    });

    it('should not allow voter to reset', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const voter = await roomService.join(room.id, 'Voter');
      const task = await taskService.add(room.id, 'Task');

      const result = await voteService.reset(task.id, voter!.user.id);

      expect(result).toBe(false);
    });
  });
});


