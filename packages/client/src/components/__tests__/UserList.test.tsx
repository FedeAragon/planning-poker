import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserList } from '../UserList';
import type { User } from '@planning-poker/shared';

// Mock socket
vi.mock('../../services/socket', () => ({
  getSocket: () => ({
    emit: vi.fn(),
  }),
}));

describe('UserList', () => {
  const mockUsers: User[] = [
    { id: '1', name: 'Creator', roomId: 'room1', connected: true, role: 'creator' },
    { id: '2', name: 'Alice', roomId: 'room1', connected: true, role: 'admin' },
    { id: '3', name: 'Bob', roomId: 'room1', connected: true, role: 'voter' },
    { id: '4', name: 'Charlie', roomId: 'room1', connected: false, role: 'observer' },
  ];

  it('renders all users', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByText('Creator')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows user count correctly', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByText(/Users \(3\/4\)/)).toBeInTheDocument();
  });

  it('shows creator badge', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByTitle('Creator')).toHaveTextContent('👑');
  });

  it('shows admin badge', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByTitle('Admin')).toHaveTextContent('⭐');
  });

  it('shows observer badge', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByTitle('Observer')).toHaveTextContent('👁️');
  });

  it('marks current user with (you)', () => {
    render(<UserList users={mockUsers} currentUserId="2" />);
    expect(screen.getByText('(you)')).toBeInTheDocument();
  });

  it('shows voted indicator for users who voted', () => {
    render(<UserList users={mockUsers} votedUserIds={['2', '3']} />);
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks).toHaveLength(2);
  });

  it('shows disconnected users with opacity', () => {
    const { container } = render(<UserList users={mockUsers} />);
    const charlieItem = container.querySelector('li.opacity-50');
    expect(charlieItem).toBeInTheDocument();
    expect(charlieItem?.textContent).toContain('Charlie');
  });

  it('shows role change menu for creator', () => {
    render(<UserList users={mockUsers} currentUserId="1" currentUserRole="creator" />);
    // Creator should see menu buttons for Alice, Bob, and Charlie (not self)
    const menuButtons = screen.getAllByTitle('Change role');
    expect(menuButtons.length).toBe(3);
  });

  it('shows role change menu for admin', () => {
    render(<UserList users={mockUsers} currentUserId="2" currentUserRole="admin" />);
    // Admin can only change voter <-> observer, so only Bob and Charlie
    const menuButtons = screen.getAllByTitle('Change role');
    expect(menuButtons.length).toBe(2);
  });

  it('does not show role change menu for voter', () => {
    render(<UserList users={mockUsers} currentUserId="3" currentUserRole="voter" />);
    expect(screen.queryByTitle('Change role')).not.toBeInTheDocument();
  });

  it('opens role menu on click', () => {
    render(<UserList users={mockUsers} currentUserId="1" currentUserRole="creator" />);
    const menuButtons = screen.getAllByTitle('Change role');
    fireEvent.click(menuButtons[0]); // Click menu for Alice
    
    // Should show available roles for Alice (admin -> voter, observer)
    // Text is lowercase, CSS capitalizes it visually
    expect(screen.getByText('voter')).toBeInTheDocument();
    expect(screen.getByText('observer')).toBeInTheDocument();
  });
});

