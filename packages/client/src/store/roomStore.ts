import { create } from 'zustand';
import type { Room, User, Task, Vote } from '@planning-poker/shared';

interface RoomState {
  room: Room | null;
  users: User[];
  tasks: Task[];
  votes: Vote[];
  currentTaskId: string | null;
  votesRevealed: boolean;
  setRoom: (room: Room | null) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  removeUser: (userId: string) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  setVotes: (votes: Vote[]) => void;
  setCurrentTaskId: (taskId: string | null) => void;
  setVotesRevealed: (revealed: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  users: [],
  tasks: [],
  votes: [],
  currentTaskId: null,
  votesRevealed: false,
  setRoom: (room) => set({ room, currentTaskId: room?.currentTaskId || null }),
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => {
    // Avoid duplicates - update if exists, add if new
    const exists = state.users.some(u => u.id === user.id);
    if (exists) {
      return { users: state.users.map(u => u.id === user.id ? user : u) };
    }
    return { users: [...state.users, user] };
  }),
  updateUser: (userId, updates) => set((state) => ({
    users: state.users.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
  })),
  removeUser: (userId) => set((state) => ({
    users: state.users.filter((u) => u.id !== userId),
  })),
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
  })),
  setVotes: (votes) => set({ votes }),
  setCurrentTaskId: (currentTaskId) => set({ currentTaskId, votesRevealed: false, votes: [] }),
  setVotesRevealed: (votesRevealed) => set({ votesRevealed }),
  reset: () => set({ 
    room: null, 
    users: [], 
    tasks: [], 
    votes: [], 
    currentTaskId: null, 
    votesRevealed: false 
  }),
}));

