import { render, screen } from '@testing-library/react';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges truthy class names', () => {
    expect(cn('a', 'b', false && 'c', 0 && 'd')).toBe('a b');
  });

  it('merges tailwind classes (later wins)', () => {
    expect(cn('px-2 py-1', 'px-4')).toContain('px-4');
    expect(cn('px-2 py-1', 'px-4')).not.toContain('px-2');
  });
});

describe('render smoke', () => {
  it('renders a button into the jsdom document', () => {
    render(<button type="button">Go</button>);
    expect(screen.getByRole('button')).toHaveTextContent('Go');
  });
});
