import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from '../pages/NotFoundPage';

describe('NotFoundPage component', () => {
  it('renders 404 heading and return link', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/404 — Page Not Found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/The route you navigated to does not exist in DevLens/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Tools Directory/i })).toBeInTheDocument();
  });
});
