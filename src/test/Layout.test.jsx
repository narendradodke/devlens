import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../components/common/ThemeProvider';
import { Layout } from '../components/layout/Layout';

describe('Layout component', () => {
  function renderLayout(initialEntries = ['/']) {
    return render(
      <ThemeProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Layout />
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  it('renders header with brand title and privacy badge', () => {
    renderLayout();
    expect(screen.getAllByText('DevLens').length).toBeGreaterThan(0);
    expect(screen.getByText('100% In-Browser')).toBeInTheDocument();
  });

  it('renders sidebar navigation with tool links', () => {
    renderLayout();
    expect(screen.getAllByText('Overview & Directory').length).toBeGreaterThan(0);
    expect(screen.getAllByText('JSON Studio').length).toBeGreaterThan(0);
    expect(screen.getAllByText('JWT Inspector').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Regex Playground').length).toBeGreaterThan(0);
  });

  it('toggles theme when clicking the theme switch button', async () => {
    const user = userEvent.setup();
    renderLayout();

    const themeButton = screen.getByLabelText(/Switch to (light|dark) theme/i);
    expect(themeButton).toBeInTheDocument();

    const initialLabel = themeButton.getAttribute('aria-label');
    await user.click(themeButton);

    const updatedButton = screen.getByLabelText(/Switch to (light|dark) theme/i);
    expect(updatedButton.getAttribute('aria-label')).not.toBe(initialLabel);
  });

  it('renders footer with MIT license note', () => {
    renderLayout();
    expect(screen.getByText(/Released under MIT License/i)).toBeInTheDocument();
  });
});
