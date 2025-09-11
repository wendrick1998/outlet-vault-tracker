import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByRole, getByText } = render(<Button>Click me</Button>);
    expect(getByRole('button')).toBeInTheDocument();
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { getByRole } = render(<Button variant="outline">Outline Button</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('border-input');
  });

  it('handles disabled state', () => {
    const { getByRole } = render(<Button disabled>Disabled Button</Button>);
    const button = getByRole('button');
    expect(button).toBeDisabled();
  });

  it('handles click events', () => {
    let clicked = false;
    const { getByRole } = render(<Button onClick={() => { clicked = true; }}>Click me</Button>);
    
    const button = getByRole('button');
    button.click();
    expect(clicked).toBe(true);
  });
});