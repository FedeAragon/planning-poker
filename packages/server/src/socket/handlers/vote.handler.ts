import type { TypedSocket, TypedServer } from '../types';
import { voteService } from '../../services/vote.service';
import { taskService } from '../../services/task.service';
import { userService } from '../../services/user.service';

export function registerVoteHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('vote:submit', async ({ value }) => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const currentTask = await taskService.findCurrentByRoomId(roomId);
      if (!currentTask) {
        socket.emit('error', { message: 'No active voting task' });
        return;
      }

      const result = await voteService.submit(currentTask.id, userId, value);
      if (!result) {
        socket.emit('error', { message: 'Cannot vote' });
        return;
      }

      // Check if vote was updated (user already had a vote)
      if (result.wasUpdate) {
        io.to(roomId).emit('vote:updated', { userId });
        // If votes were already revealed, recalculate and send updated results
        if (result.alreadyRevealed) {
          const recalcResult = await voteService.recalculate(currentTask.id);
          if (recalcResult) {
            io.to(roomId).emit('voting:revealed', {
              votes: recalcResult.votes,
              finalEstimate: recalcResult.finalEstimate,
              percentages: recalcResult.percentages,
            });
          }
        }
      } else {
        io.to(roomId).emit('vote:registered', { userId });
      }

      // Auto-reveal if all voted (only for first-time votes and if not already revealed)
      if (result.allVoted && !result.wasUpdate && !result.alreadyRevealed) {
        const revealResult = await voteService.recalculate(currentTask.id);
        if (revealResult) {
          io.to(roomId).emit('voting:revealed', {
            votes: revealResult.votes,
            finalEstimate: revealResult.finalEstimate,
            percentages: revealResult.percentages,
          });
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  });

  socket.on('voting:reveal', async () => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const currentTask = await taskService.findCurrentByRoomId(roomId);
      if (!currentTask) {
        socket.emit('error', { message: 'No active voting task' });
        return;
      }

      const result = await voteService.reveal(currentTask.id, userId);
      if (!result) {
        socket.emit('error', { message: 'Not authorized to reveal' });
        return;
      }

      io.to(roomId).emit('voting:revealed', {
        votes: result.votes,
        finalEstimate: result.finalEstimate,
        percentages: result.percentages,
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to reveal votes' });
    }
  });

  socket.on('voting:next', async () => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const currentTask = await taskService.findCurrentByRoomId(roomId);
      if (!currentTask) {
        socket.emit('error', { message: 'No active voting task' });
        return;
      }

      const result = await voteService.next(currentTask.id, userId);
      if (!result) {
        socket.emit('error', { message: 'Not authorized to advance' });
        return;
      }

      // Send updated tasks list
      const updatedTasks = await taskService.findByRoomId(roomId);
      io.to(roomId).emit('task:order_updated', { tasks: updatedTasks });

      io.to(roomId).emit('voting:next_task', {
        taskId: result.nextTask || '',
        previousTaskDuration: result.previousTask.duration,
      });

      if (result.nextTask) {
        const nextTask = await taskService.findCurrentByRoomId(roomId);
        if (nextTask?.votingStartedAt) {
          io.to(roomId).emit('timer:sync', { startedAt: nextTask.votingStartedAt });
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to advance to next task' });
    }
  });

  socket.on('voting:reset', async () => {
    const { userId, roomId } = socket.data;
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    try {
      const currentTask = await taskService.findCurrentByRoomId(roomId);
      if (!currentTask) {
        socket.emit('error', { message: 'No active voting task' });
        return;
      }

      const success = await voteService.reset(currentTask.id, userId);
      if (!success) {
        socket.emit('error', { message: 'Not authorized to reset' });
        return;
      }

      io.to(roomId).emit('voting:reset');

      const updatedTask = await taskService.findCurrentByRoomId(roomId);
      if (updatedTask?.votingStartedAt) {
        io.to(roomId).emit('timer:sync', { startedAt: updatedTask.votingStartedAt });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to reset voting' });
    }
  });
}

