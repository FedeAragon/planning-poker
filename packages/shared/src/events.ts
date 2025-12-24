import type { User, Room, Task, Vote, VoteValue, Role, RoomState } from './types';

export interface ClientToServerEvents {
  'user:register': (data: { name: string }) => void;
  'room:create': (data: { name: string }) => void;
  'room:join': (data: { roomId: string }) => void;
  'room:rejoin': (data: { roomId: string; userId: string }) => void;
  'room:finish': () => void;
  'user:change_role': (data: { userId: string; role: Role }) => void;
  'user:kick': (data: { userId: string }) => void;
  'task:add': (data: { title: string }) => void;
  'task:add_bulk': (data: { titles: string[] }) => void;
  'task:reorder': (data: { taskId: string; newOrder: number }) => void;
  'task:update_title': (data: { taskId: string; title: string }) => void;
  'vote:submit': (data: { value: VoteValue }) => void;
  'voting:reveal': () => void;
  'voting:next': () => void;
  'voting:reset': () => void;
}

export interface ServerToClientEvents {
  'user:registered': (data: { user: User }) => void;
  'user:reconnected': (data: RoomState & { user: User }) => void;
  'user:connected': (data: { user: User }) => void;
  'user:disconnected': (data: { userId: string }) => void;
  'user:kicked': (data: { userId: string }) => void;
  'user:you_were_kicked': (data: { message: string }) => void;
  'user:role_changed': (data: { userId: string; role: Role }) => void;
  'room:created': (data: { room: Room }) => void;
  'room:joined': (data: RoomState) => void;
  'room:updated': (data: { room: Room }) => void;
  'room:user_joined': (data: { user: User }) => void;
  'task:added': (data: { task: Task }) => void;
  'task:updated': (data: { task: Task }) => void;
  'task:order_updated': (data: { tasks: Task[] }) => void;
  'task:current_changed': (data: { taskId: string; previousTaskDuration?: number }) => void;
  'vote:registered': (data: { userId: string }) => void;
  'vote:updated': (data: { userId: string }) => void;
  'voting:revealed': (data: { votes: Vote[]; finalEstimate: number; percentages: Record<number, number> }) => void;
  'voting:next_task': (data: { taskId: string; previousTaskDuration: number }) => void;
  'voting:reset': () => void;
  'timer:sync': (data: { startedAt: Date }) => void;
  'error': (data: { message: string }) => void;
}

