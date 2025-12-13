import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VotingResults } from '../VotingResults';
import type { Vote, User } from '@planning-poker/shared';

describe('VotingResults', () => {
  const mockUsers: User[] = [
    { id: 'u1', name: 'Alice', roomId: 'room1', connected: true, role: 'creator' },
    { id: 'u2', name: 'Bob', roomId: 'room1', connected: true, role: 'voter' },
    { id: 'u3', name: 'Charlie', roomId: 'room1', connected: true, role: 'voter' },
  ];

  const mockVotes: Vote[] = [
    { id: 'v1', taskId: 't1', userId: 'u1', value: 5 },
    { id: 'v2', taskId: 't1', userId: 'u2', value: 5 },
    { id: 'v3', taskId: 't1', userId: 'u3', value: 3 },
  ];

  const mockPercentages = { 5: 67, 3: 33 };

  it('renders distribution section', () => {
    render(
      <VotingResults 
        votes={mockVotes} 
        users={mockUsers} 
        percentages={mockPercentages} 
        finalEstimate={5} 
      />
    );
    expect(screen.getByText('Distribution')).toBeInTheDocument();
  });

  it('shows vote percentages', () => {
    render(
      <VotingResults 
        votes={mockVotes} 
        users={mockUsers} 
        percentages={mockPercentages} 
        finalEstimate={5} 
      />
    );
    expect(screen.getByText('67% (2)')).toBeInTheDocument();
    expect(screen.getByText('33% (1)')).toBeInTheDocument();
  });

  it('shows individual votes with user names', () => {
    render(
      <VotingResults 
        votes={mockVotes} 
        users={mockUsers} 
        percentages={mockPercentages} 
        finalEstimate={5} 
      />
    );
    expect(screen.getByText('Alice:')).toBeInTheDocument();
    expect(screen.getByText('Bob:')).toBeInTheDocument();
    expect(screen.getByText('Charlie:')).toBeInTheDocument();
  });

  it('shows final estimate prominently', () => {
    render(
      <VotingResults 
        votes={mockVotes} 
        users={mockUsers} 
        percentages={mockPercentages} 
        finalEstimate={5} 
      />
    );
    expect(screen.getByText('Final Estimate:')).toBeInTheDocument();
    // Final estimate value is displayed
    const finalEstimateValue = screen.getAllByText('5').find(
      el => el.classList.contains('text-3xl')
    );
    expect(finalEstimateValue).toBeInTheDocument();
  });

  it('hides values with 0% percentage', () => {
    render(
      <VotingResults 
        votes={mockVotes} 
        users={mockUsers} 
        percentages={mockPercentages} 
        finalEstimate={5} 
      />
    );
    // Values 0, 1, 2, 8 should not appear in distribution (0%)
    const distributionSection = screen.getByText('Distribution').parentElement;
    expect(distributionSection).not.toHaveTextContent('0%');
  });

  it('handles unknown user gracefully', () => {
    const votesWithUnknown: Vote[] = [
      ...mockVotes,
      { id: 'v4', taskId: 't1', userId: 'unknown', value: 2 },
    ];
    const percentagesWithUnknown = { ...mockPercentages, 2: 25 };
    
    render(
      <VotingResults 
        votes={votesWithUnknown} 
        users={mockUsers} 
        percentages={percentagesWithUnknown} 
        finalEstimate={5} 
      />
    );
    expect(screen.getByText('Unknown:')).toBeInTheDocument();
  });
});

