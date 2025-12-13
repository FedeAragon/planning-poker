import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskQueue } from '../TaskQueue';
import type { Task } from '@planning-poker/shared';

// Mock socket
vi.mock('../../services/socket', () => ({
  getSocket: () => ({
    emit: vi.fn(),
  }),
}));

describe('TaskQueue', () => {
  const mockTasks: Task[] = [
    { id: '1', roomId: 'room1', title: 'Task 1', order: 0, status: 'voting', finalEstimate: null, votingStartedAt: null, votingDurationSeconds: null },
    { id: '2', roomId: 'room1', title: 'Task 2', order: 1, status: 'pending', finalEstimate: null, votingStartedAt: null, votingDurationSeconds: null },
    { id: '3', roomId: 'room1', title: 'Task 3', order: 2, status: 'pending', finalEstimate: null, votingStartedAt: null, votingDurationSeconds: null },
    { id: '4', roomId: 'room1', title: 'Task 4', order: 3, status: 'voted', finalEstimate: 5, votingStartedAt: null, votingDurationSeconds: 120 },
  ];

  it('renders upcoming tasks section', () => {
    render(<TaskQueue tasks={mockTasks} currentTaskId="1" />);
    expect(screen.getByText('Upcoming Tasks (3)')).toBeInTheDocument();
  });

  it('renders voted tasks section', () => {
    render(<TaskQueue tasks={mockTasks} currentTaskId="1" />);
    expect(screen.getByText('Voted Tasks (1)')).toBeInTheDocument();
  });

  it('shows pending task titles', () => {
    render(<TaskQueue tasks={mockTasks} currentTaskId="1" />);
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('shows voted task with estimate', () => {
    render(<TaskQueue tasks={mockTasks} currentTaskId="1" />);
    expect(screen.getByText('Task 4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows voting duration for voted tasks', () => {
    render(<TaskQueue tasks={mockTasks} currentTaskId="1" />);
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('shows drag handles when canReorder is true', () => {
    render(<TaskQueue tasks={mockTasks} currentTaskId="1" canReorder />);
    expect(screen.getAllByText('⋮⋮')).toHaveLength(2); // 2 pending tasks
  });

  it('shows make current button for admin', () => {
    render(<TaskQueue tasks={mockTasks} currentTaskId="1" isAdmin canReorder />);
    expect(screen.getAllByTitle('Vote this now')).toHaveLength(2);
  });

  it('shows empty message when no pending tasks', () => {
    const votedOnly: Task[] = [
      { id: '1', roomId: 'room1', title: 'Done', order: 0, status: 'voted', finalEstimate: 3, votingStartedAt: null, votingDurationSeconds: 60 },
    ];
    render(<TaskQueue tasks={votedOnly} currentTaskId={null} />);
    expect(screen.getByText('No pending tasks')).toBeInTheDocument();
  });

  it('shows empty message when no voted tasks', () => {
    const pendingOnly: Task[] = [
      { id: '1', roomId: 'room1', title: 'Todo', order: 0, status: 'pending', finalEstimate: null, votingStartedAt: null, votingDurationSeconds: null },
    ];
    render(<TaskQueue tasks={pendingOnly} currentTaskId={null} />);
    expect(screen.getByText('No voted tasks yet')).toBeInTheDocument();
  });
});


