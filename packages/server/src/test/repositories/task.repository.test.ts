import { describe, it, expect, beforeEach } from 'vitest';
import { taskRepository } from '../../repositories/task.repository';
import { roomRepository } from '../../repositories/room.repository';

describe('TaskRepository', () => {
  let roomId: string;

  beforeEach(async () => {
    const room = await roomRepository.create({ name: 'Test Room' });
    roomId = room.id;
  });

  describe('create', () => {
    it('should create a task with pending status', async () => {
      const task = await taskRepository.create({ roomId, title: 'Task 1', order: 0 });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Task 1');
      expect(task.order).toBe(0);
      expect(task.status).toBe('pending');
      expect(task.finalEstimate).toBeNull();
    });
  });

  describe('createMany', () => {
    it('should create multiple tasks', async () => {
      const tasks = await taskRepository.createMany([
        { roomId, title: 'Task 1', order: 0 },
        { roomId, title: 'Task 2', order: 1 },
        { roomId, title: 'Task 3', order: 2 },
      ]);

      expect(tasks).toHaveLength(3);
    });
  });

  describe('findByRoomId', () => {
    it('should find all tasks ordered by order', async () => {
      await taskRepository.create({ roomId, title: 'Task 2', order: 1 });
      await taskRepository.create({ roomId, title: 'Task 1', order: 0 });
      await taskRepository.create({ roomId, title: 'Task 3', order: 2 });

      const tasks = await taskRepository.findByRoomId(roomId);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
      expect(tasks[2].title).toBe('Task 3');
    });
  });

  describe('findPendingByRoomId', () => {
    it('should only find pending tasks', async () => {
      const task1 = await taskRepository.create({ roomId, title: 'Pending', order: 0 });
      const task2 = await taskRepository.create({ roomId, title: 'Voting', order: 1 });
      await taskRepository.startVoting(task2.id);

      const pending = await taskRepository.findPendingByRoomId(roomId);

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(task1.id);
    });
  });

  describe('startVoting', () => {
    it('should set status to voting and record start time', async () => {
      const task = await taskRepository.create({ roomId, title: 'Test', order: 0 });
      const started = await taskRepository.startVoting(task.id);

      expect(started?.status).toBe('voting');
      expect(started?.votingStartedAt).toBeDefined();
    });
  });

  describe('finishVoting', () => {
    it('should set status to voted with estimate and duration', async () => {
      const task = await taskRepository.create({ roomId, title: 'Test', order: 0 });
      await taskRepository.startVoting(task.id);
      
      const finished = await taskRepository.finishVoting(task.id, 5, 120);

      expect(finished?.status).toBe('voted');
      expect(finished?.finalEstimate).toBe(5);
      expect(finished?.votingDurationSeconds).toBe(120);
    });
  });

  describe('resetVoting', () => {
    it('should reset voting state and clear estimate', async () => {
      const task = await taskRepository.create({ roomId, title: 'Test', order: 0 });
      await taskRepository.startVoting(task.id);
      await taskRepository.finishVoting(task.id, 5, 60);
      
      const reset = await taskRepository.resetVoting(task.id);

      expect(reset?.status).toBe('voting');
      expect(reset?.finalEstimate).toBeNull();
      expect(reset?.votingDurationSeconds).toBeNull();
      expect(reset?.votingStartedAt).toBeDefined();
    });
  });

  describe('getMaxOrder', () => {
    it('should return max order', async () => {
      await taskRepository.create({ roomId, title: 'Task 1', order: 0 });
      await taskRepository.create({ roomId, title: 'Task 2', order: 5 });
      await taskRepository.create({ roomId, title: 'Task 3', order: 3 });

      const maxOrder = await taskRepository.getMaxOrder(roomId);

      expect(maxOrder).toBe(5);
    });

    it('should return -1 for room with no tasks', async () => {
      const maxOrder = await taskRepository.getMaxOrder(roomId);
      expect(maxOrder).toBe(-1);
    });
  });

  describe('getTop3Slowest', () => {
    it('should return top 3 slowest tasks', async () => {
      const task1 = await taskRepository.create({ roomId, title: 'Fast', order: 0 });
      const task2 = await taskRepository.create({ roomId, title: 'Slow', order: 1 });
      const task3 = await taskRepository.create({ roomId, title: 'Medium', order: 2 });
      const task4 = await taskRepository.create({ roomId, title: 'Slowest', order: 3 });

      await taskRepository.finishVoting(task1.id, 3, 30);
      await taskRepository.finishVoting(task2.id, 5, 180);
      await taskRepository.finishVoting(task3.id, 3, 90);
      await taskRepository.finishVoting(task4.id, 8, 300);

      const slowest = await taskRepository.getTop3Slowest(roomId);

      expect(slowest).toHaveLength(3);
      expect(slowest[0].title).toBe('Slowest');
      expect(slowest[1].title).toBe('Slow');
      expect(slowest[2].title).toBe('Medium');
    });
  });
});


