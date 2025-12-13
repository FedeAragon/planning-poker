import { create } from 'zustand';
import type { User } from '@planning-poker/shared';

interface UserState {
  user: User | null;
  userName: string;
  isConnected: boolean;
  setUser: (user: User | null) => void;
  setUserName: (name: string) => void;
  setConnected: (connected: boolean) => void;
  updateRole: (role: User['role']) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  userName: '',
  isConnected: false,
  setUser: (user) => set({ user }),
  setUserName: (userName) => set({ userName }),
  setConnected: (isConnected) => set({ isConnected }),
  updateRole: (role) => set((state) => ({
    user: state.user ? { ...state.user, role } : null,
  })),
  reset: () => set({ user: null, userName: '', isConnected: false }),
}));


