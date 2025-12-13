import { taskRepository } from '../repositories/task.repository';
import { voteRepository } from '../repositories/vote.repository';
import { roomRepository } from '../repositories/room.repository';
import type { Task } from '@planning-poker/shared';

export interface ReorderResult {
  tasks: Task[];
  previousTaskDiscarded: boolean;
}

export const taskService = {
  async add(roomId: string, title: string): Promise<Task> {
    const maxOrder = await taskRepository.getMaxOrder(roomId);
    const task = await taskRepository.create({
      roomId,
      title,
      order: maxOrder + 1,
    });

    // If this is the first task and no current voting, start voting on it
    const room = await roomRepository.findById(roomId);
    if (room && !room.currentTaskId) {
      await this.startVoting(task.id);
      await roomRepository.setCurrentTask(roomId, task.id);
    }

    return taskRepository.findById(task.id) as Promise<Task>;
  },

  async addBulk(roomId: string, titles: string[]): Promise<Task[]> {
    const maxOrder = await taskRepository.getMaxOrder(roomId);
    const tasks = titles.map((title, index) => ({
      roomId,
      title,
      order: maxOrder + 1 + index,
    }));

    await taskRepository.createMany(tasks);
    const allTasks = await taskRepository.findByRoomId(roomId);

    // If no current voting task, start with the first pending
    const room = await roomRepository.findById(roomId);
    if (room && !room.currentTaskId) {
      const firstPending = allTasks.find(t => t.status === 'pending');
      if (firstPending) {
        await this.startVoting(firstPending.id);
        await roomRepository.setCurrentTask(roomId, firstPending.id);
      }
    }

    return taskRepository.findByRoomId(roomId);
  },

  async updateTitle(taskId: string, title: string): Promise<Task | null> {
    const task = await taskRepository.findById(taskId);
    if (!task) return null;
    
    return taskRepository.update(taskId, { title });
  },

  async reorder(taskId: string, newOrder: number): Promise<ReorderResult> {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new Error('Task not found');

    const tasks = await taskRepository.findByRoomId(task.roomId);
    const currentVotingTask = tasks.find(t => t.status === 'voting');
    let previousTaskDiscarded = false;

    // If moving to position 0 and there's a current voting task
    if (newOrder === 0 && currentVotingTask && currentVotingTask.id !== taskId) {
      // Discard votes from current task and make it pending
      await voteRepository.deleteByTaskId(currentVotingTask.id);
      await taskRepository.update(currentVotingTask.id, { 
        status: 'pending',
        votingStartedAt: null,
        votingDurationSeconds: null,
      });
      
      // Start voting on the new task
      await this.startVoting(taskId);
      await roomRepository.setCurrentTask(task.roomId, taskId);
      previousTaskDiscarded = true;
    }

    // Get only pending tasks (excluding current voting task)
    const pendingTasks = tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => a.order - b.order);

    // Find and move the task
    const taskIndex = pendingTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      pendingTasks.splice(taskIndex, 1);
    }
    pendingTasks.splice(newOrder, 0, task);

    // Calculate base order (after voting task if exists)
    const baseOrder = currentVotingTask ? 1 : 0;

    // Update orders for all pending tasks
    for (let i = 0; i < pendingTasks.length; i++) {
      const newTaskOrder = baseOrder + i;
      if (pendingTasks[i].order !== newTaskOrder) {
        await taskRepository.updateOrder(pendingTasks[i].id, newTaskOrder);
      }
    }

    const updatedTasks = await taskRepository.findByRoomId(task.roomId);
    return { tasks: updatedTasks, previousTaskDiscarded };
  },

  async startVoting(taskId: string): Promise<Task | null> {
    return taskRepository.startVoting(taskId);
  },

  async findByRoomId(roomId: string): Promise<Task[]> {
    return taskRepository.findByRoomId(roomId);
  },

  async findCurrentByRoomId(roomId: string): Promise<Task | null> {
    return taskRepository.findCurrentByRoomId(roomId);
  },

  async getTop3Slowest(roomId: string): Promise<Task[]> {
    return taskRepository.getTop3Slowest(roomId);
  },

  async getTotalVotingTime(roomId: string): Promise<number> {
    const votedTasks = await taskRepository.findVotedByRoomId(roomId);
    return votedTasks.reduce((total, task) => {
      return total + (task.votingDurationSeconds || 0);
    }, 0);
  },
};

