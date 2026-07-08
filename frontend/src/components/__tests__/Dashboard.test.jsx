import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';

describe('Dashboard Component', () => {
  it('renders the Dashboard header', () => {
    render(<Dashboard />);
    expect(screen.getByText('Golden Profiles Dashboard')).toBeInTheDocument();
  });

  it('renders the mock profiles table', () => {
    render(<Dashboard />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });
});
