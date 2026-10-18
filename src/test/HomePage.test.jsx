import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';

describe('HomePage component', () => {
  function renderHomePage() {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  }

  it('renders page heading and directory statistics', () => {
    renderHomePage();
    expect(screen.getByText('DevLens Developer Toolkit')).toBeInTheDocument();
    expect(screen.getByText(/Zero-Telemetry Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/of 6 tools/i)).toBeInTheDocument();
  });

  it('filters tools correctly using the search bar', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search tools by name/i);
    await user.type(searchInput, 'jwt');

    expect(screen.getByText('JWT Inspector')).toBeInTheDocument();
    expect(screen.queryByText('Regex Playground')).not.toBeInTheDocument();
  });

  it('displays empty state when no tools match query', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search tools by name/i);
    await user.type(searchInput, 'nonexistentqueryxyz');

    expect(screen.getByText(/No developer tools found matching/i)).toBeInTheDocument();
  });

  it('filters tools by category tab', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const securityTab = screen.getByRole('tab', { name: 'Security & Auth' });
    await user.click(securityTab);

    expect(screen.getByText('JWT Inspector')).toBeInTheDocument();
    expect(screen.queryByText('JSON Studio')).not.toBeInTheDocument();
  });
});
