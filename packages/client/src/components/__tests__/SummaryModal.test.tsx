import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryModal } from '../SummaryModal';
import type { Task } from '@planning-poker/shared';

describe('SummaryModal', () => {
  const mockTasks: Task[] = [
    { id: '1', roomId: 'room1', title: 'Fast Task', order: 0, status: 'voted', finalEstimate: 3, votingStartedAt: null, votingDurationSeconds: 30 },
    { id: '2', roomId: 'room1', title: 'Medium Task', order: 1, status: 'voted', finalEstimate: 5, votingStartedAt: null, votingDurationSeconds: 120 },
    { id: '3', roomId: 'room1', title: 'Slow Task', order: 2, status: 'voted', finalEstimate: 8, votingStartedAt: null, votingDurationSeconds: 300 },
    { id: '4', roomId: 'room1', title: 'Pending Task', order: 3, status: 'pending', finalEstimate: null, votingStartedAt: null, votingDurationSeconds: null },
  ];

  it('renders modal with room name', () => {
    render(<SummaryModal isOpen={true} onClose={() => {}} tasks={mockTasks} roomName="Sprint 42" />);
    expect(screen.getByText('Sprint 42 - Summary')).toBeInTheDocument();
  });

  it('shows top 3 slowest tasks section', () => {
    render(<SummaryModal isOpen={true} onClose={() => {}} tasks={mockTasks} roomName="Sprint 42" />);
    expect(screen.getByText('🐢 Top 3 Slowest Tasks')).toBeInTheDocument();
  });

  it('orders slowest tasks correctly', () => {
    render(<SummaryModal isOpen={true} onClose={() => {}} tasks={mockTasks} roomName="Sprint 42" />);
    const slowSection = screen.getByText('🐢 Top 3 Slowest Tasks').parentElement;
    
    // Slow Task (300s = 5:00) should be first
    expect(slowSection).toHaveTextContent('Slow Task');
    expect(slowSection).toHaveTextContent('5:00');
  });

  it('shows all voted tasks', () => {
    render(<SummaryModal isOpen={true} onClose={() => {}} tasks={mockTasks} roomName="Sprint 42" />);
    expect(screen.getByText('📋 All Tasks (3)')).toBeInTheDocument();
  });

  it('does not show pending tasks', () => {
    render(<SummaryModal isOpen={true} onClose={() => {}} tasks={mockTasks} roomName="Sprint 42" />);
    expect(screen.queryByText('Pending Task')).not.toBeInTheDocument();
  });

  it('shows total points', () => {
    render(<SummaryModal isOpen={true} onClose={() => {}} tasks={mockTasks} roomName="Sprint 42" />);
    expect(screen.getByText('Total Points')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // 3 + 5 + 8
  });

  it('shows total time', () => {
    render(<SummaryModal isOpen={true} onClose={() => {}} tasks={mockTasks} roomName="Sprint 42" />);
    expect(screen.getByText('Total Time')).toBeInTheDocument();
    expect(screen.getByText('7:30')).toBeInTheDocument(); // 30 + 120 + 300 = 450s = 7:30
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<SummaryModal isOpen={true} onClose={onClose} tasks={mockTasks} roomName="Sprint 42" />);
    
    screen.getByText('Close').click();
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(<SummaryModal isOpen={false} onClose={() => {}} tasks={mockTasks} roomName="Sprint 42" />);
    expect(screen.queryByText('Sprint 42 - Summary')).not.toBeInTheDocument();
  });
});

