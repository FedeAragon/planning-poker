import { VOTE_VALUES, ROLES, ROOM_STATUSES, TASK_STATUSES } from './constants';

export type VoteValue = (typeof VOTE_VALUES)[number];

export type Role = (typeof ROLES)[number];

export type RoomStatus = (typeof ROOM_STATUSES)[number];

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface User {
  id: string;
  name: string;
  roomId: string;
  connected: boolean;
  role: Role;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  currentTaskId: string | null;
}

export interface Task {
  id: string;
  roomId: string;
  title: string;
  order: number;
  status: TaskStatus;
  finalEstimate: number | null;
  votingStartedAt: Date | null;
  votingDurationSeconds: number | null;
}

export interface Vote {
  id: string;
  taskId: string;
  userId: string;
  value: VoteValue;
}

export interface RoomState {
  room: Room;
  users: User[];
  tasks: Task[];
  votes: Vote[];
}

export interface VotingResult {
  votes: Vote[];
  finalEstimate: number;
  percentages: Record<VoteValue, number>;
}

export interface TaskSummary {
  task: Task;
  durationSeconds: number;
}

