import express, { Express } from 'express';
import cors from 'cors';
import { roomService } from './services/room.service';
import { taskService } from './services/task.service';

const app: Express = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// REST API: Create room with tasks
app.post('/api/rooms', async (req, res) => {
  try {
    const { roomName, userName, tasks } = req.body;

    // Validation
    if (!roomName || typeof roomName !== 'string' || !roomName.trim()) {
      res.status(400).json({ error: 'roomName is required and must be a non-empty string' });
      return;
    }

    if (!userName || typeof userName !== 'string' || !userName.trim()) {
      res.status(400).json({ error: 'userName is required and must be a non-empty string' });
      return;
    }

    if (tasks !== undefined && !Array.isArray(tasks)) {
      res.status(400).json({ error: 'tasks must be an array of strings' });
      return;
    }

    // Create room with creator user
    const { room, user } = await roomService.create(roomName.trim(), userName.trim());

    // Add tasks if provided
    let tasksCreated = 0;
    if (tasks && tasks.length > 0) {
      const validTasks = tasks
        .filter((t: unknown) => typeof t === 'string' && t.trim())
        .map((t: string) => t.trim());
      
      if (validTasks.length > 0) {
        await taskService.addBulk(room.id, validTasks);
        tasksCreated = validTasks.length;
      }
    }

    // Build room URL with rejoin param for admin access
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const roomUrl = `${clientUrl}/room/${room.id}?rejoin=${user.id}`;

    res.status(201).json({
      roomId: room.id,
      roomUrl,
      userId: user.id,
      tasksCreated,
    });
  } catch (error) {
    console.error('Error creating room via API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { app };

