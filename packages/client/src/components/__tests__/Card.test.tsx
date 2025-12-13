import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Card data-testid="card">Default</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('border');
  });

  it('applies elevated variant styles', () => {
    render(<Card variant="elevated">Elevated</Card>);
    const card = screen.getByText('Elevated');
    expect(card.className).toContain('shadow-lg');
  });

  it('applies outlined variant styles', () => {
    render(<Card variant="outlined">Outlined</Card>);
    const card = screen.getByText('Outlined');
    expect(card.className).toContain('border-2');
  });

  it('applies custom className', () => {
    render(<Card className="p-4 my-custom">Custom</Card>);
    const card = screen.getByText('Custom');
    expect(card.className).toContain('my-custom');
  });
});

