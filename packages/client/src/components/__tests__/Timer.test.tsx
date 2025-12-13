import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Timer } from '../Timer';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when startedAt is null', () => {
    const { container } = render(<Timer startedAt={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays 00:00 when just started', () => {
    const now = new Date();
    vi.setSystemTime(now);
    render(<Timer startedAt={now} />);
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('displays correct time after 65 seconds', () => {
    const startTime = new Date('2024-01-01T10:00:00');
    vi.setSystemTime(new Date('2024-01-01T10:01:05'));
    render(<Timer startedAt={startTime} />);
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('shows clock icon', () => {
    const startTime = new Date();
    vi.setSystemTime(startTime);
    render(<Timer startedAt={startTime} />);
    
    // Should have an SVG element (clock icon)
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

