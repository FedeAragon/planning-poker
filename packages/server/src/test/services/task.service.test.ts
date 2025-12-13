import { describe, it, expect } from 'vitest';
import { taskService } from '../../services/task.service';
import { roomService } from '../../services/room.service';
import { roomRepository } from '../../repositories/room.repository';

describe('TaskService', () => {
  describe('add', () => {
    it('should add task and start voting if first task', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const task = await taskService.add(room.id, 'Task 1');

      expect(task.title).toBe('Task 1');
      expect(task.status).toBe('voting');
      expect(task.votingStartedAt).not.toBeNull();

      const updatedRoom = await roomRepository.findById(room.id);
      expect(updatedRoom?.currentTaskId).toBe(task.id);
    });

    it('should add task as pending if there is already a current task', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      await taskService.add(room.id, 'Task 1');
      const task2 = await taskService.add(room.id, 'Task 2');

      expect(task2.status).toBe('pending');
    });

    it('should increment order for each new task', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const task1 = await taskService.add(room.id, 'Task 1');
      const task2 = await taskService.add(room.id, 'Task 2');
      const task3 = await taskService.add(room.id, 'Task 3');

      expect(task1.order).toBe(0);
      expect(task2.order).toBe(1);
      expect(task3.order).toBe(2);
    });
  });

  describe('addBulk', () => {
    it('should add multiple tasks', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const tasks = await taskService.addBulk(room.id, ['Task 1', 'Task 2', 'Task 3']);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[0].status).toBe('voting');
      expect(tasks[1].status).toBe('pending');
      expect(tasks[2].status).toBe('pending');
    });
  });

  describe('reorder', () => {
    it('should reorder pending tasks', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      await taskService.addBulk(room.id, ['Task 1', 'Task 2', 'Task 3', 'Task 4']);

      // Task 1 is voting (order 0), Task 2, 3, 4 are pending (orders 1, 2, 3)
      const tasks = await taskService.findByRoomId(room.id);
      const task4 = tasks.find(t => t.title === 'Task 4')!;

      // Move Task 4 to position 1 in the pending array (second pending)
      // Before: [Task2, Task3, Task4], After splice: [Task2, Task4, Task3]
      const result = await taskService.reorder(task4.id, 1);

      expect(result.previousTaskDiscarded).toBe(false);
      const reordered = result.tasks.filter(t => t.status === 'pending').sort((a, b) => a.order - b.order);
      expect(reordered[0].title).toBe('Task 2');
      expect(reordered[1].title).toBe('Task 4');
      expect(reordered[2].title).toBe('Task 3');
    });

    it('should move task to first pending position', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      await taskService.addBulk(room.id, ['Task 1', 'Task 2', 'Task 3', 'Task 4']);

      const tasks = await taskService.findByRoomId(room.id);
      const task4 = tasks.find(t => t.title === 'Task 4')!;

      // Move Task 4 to position 0 in the pending array (first pending, after voting)
      const result = await taskService.reorder(task4.id, 0);

      // Since newOrder = 0 with a voting task, this triggers override behavior
      expect(result.previousTaskDiscarded).toBe(true);
    });

    it('should discard current task when overriding position 0', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      await taskService.addBulk(room.id, ['Current', 'Next', 'Override']);

      const tasks = await taskService.findByRoomId(room.id);
      const overrideTask = tasks.find(t => t.title === 'Override')!;

      const result = await taskService.reorder(overrideTask.id, 0);

      expect(result.previousTaskDiscarded).toBe(true);
      
      const updatedTasks = await taskService.findByRoomId(room.id);
      const currentTask = updatedTasks.find(t => t.status === 'voting');
      expect(currentTask?.title).toBe('Override');

      const previousTask = updatedTasks.find(t => t.title === 'Current');
      expect(previousTask?.status).toBe('pending');
    });
  });

  describe('getTop3Slowest', () => {
    it('should return empty array when no voted tasks', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const slowest = await taskService.getTop3Slowest(room.id);
      expect(slowest).toHaveLength(0);
    });
  });

  describe('getTotalVotingTime', () => {
    it('should return 0 when no voted tasks', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const total = await taskService.getTotalVotingTime(room.id);
      expect(total).toBe(0);
    });
  });
});

