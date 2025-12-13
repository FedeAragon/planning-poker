import type { TypedSocket, TypedServer } from '../types';
import { taskService } from '../../services/task.service';
import { userService } from '../../services/user.service';

export function registerTaskHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('task:add', async ({ title }) => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const isAdmin = await userService.isAdmin(userId);
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can add tasks' });
        return;
      }

      const task = await taskService.add(roomId, title);
      io.to(roomId).emit('task:added', { task });

      if (task.status === 'voting' && task.votingStartedAt) {
        io.to(roomId).emit('task:current_changed', { taskId: task.id });
        io.to(roomId).emit('timer:sync', { startedAt: task.votingStartedAt });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to add task' });
    }
  });

  socket.on('task:add_bulk', async ({ titles }) => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const isAdmin = await userService.isAdmin(userId);
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can add tasks' });
        return;
      }

      const tasks = await taskService.addBulk(roomId, titles);
      
      for (const task of tasks) {
        io.to(roomId).emit('task:added', { task });
      }

      const currentTask = tasks.find(t => t.status === 'voting');
      if (currentTask && currentTask.votingStartedAt) {
        io.to(roomId).emit('task:current_changed', { taskId: currentTask.id });
        io.to(roomId).emit('timer:sync', { startedAt: currentTask.votingStartedAt });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to add tasks' });
    }
  });

  socket.on('task:reorder', async ({ taskId, newOrder }) => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const isAdmin = await userService.isAdmin(userId);
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can reorder tasks' });
        return;
      }

      const result = await taskService.reorder(taskId, newOrder);
      io.to(roomId).emit('task:order_updated', { tasks: result.tasks });

      if (result.previousTaskDiscarded) {
        const currentTask = result.tasks.find(t => t.status === 'voting');
        if (currentTask) {
          io.to(roomId).emit('task:current_changed', { 
            taskId: currentTask.id,
            previousTaskDuration: 0
          });
          if (currentTask.votingStartedAt) {
            io.to(roomId).emit('timer:sync', { startedAt: currentTask.votingStartedAt });
          }
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to reorder tasks' });
    }
  });

  socket.on('task:update_title', async ({ taskId, title }) => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    const trimmedTitle = title?.trim();
    if (!trimmedTitle) {
      socket.emit('error', { message: 'Task title is required' });
      return;
    }

    try {
      const isAdmin = await userService.isAdmin(userId);
      if (!isAdmin) {
        socket.emit('error', { message: 'Only admins can edit tasks' });
        return;
      }

      const task = await taskService.updateTitle(taskId, trimmedTitle);
      if (task) {
        io.to(roomId).emit('task:updated', { task });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to update task' });
    }
  });
}


