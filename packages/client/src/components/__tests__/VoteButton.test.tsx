import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoteButton } from '../VoteButton';

describe('VoteButton', () => {
  it('renders the vote value', () => {
    render(<VoteButton value={5} onClick={() => {}} />);
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<VoteButton value={3} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when selected', () => {
    render(<VoteButton value={8} selected onClick={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary-600');
  });

  it('is disabled when disabled prop is true', () => {
    render(<VoteButton value={2} disabled onClick={() => {}} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});


