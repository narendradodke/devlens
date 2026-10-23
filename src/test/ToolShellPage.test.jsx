import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ToolShellPage } from '../pages/ToolShellPage';

describe('ToolShellPage component', () => {
  it('renders tool shell with planned specs for a valid tool', () => {
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <ToolShellPage toolId="recipes" />
      </MemoryRouter>
    );

    expect(screen.getByText('Recipe Manager')).toBeInTheDocument();
    expect(screen.getByText(/Planned Tool — Implementation Scheduled for/i)).toBeInTheDocument();
    expect(screen.getByText(/Planned Technical Capabilities/i)).toBeInTheDocument();
    expect(screen.getByText(/Curated starter recipes for cURL/i)).toBeInTheDocument();
  });

  it('renders not found notice for an invalid tool id', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-tool']}>
        <ToolShellPage toolId="unknown-tool" />
      </MemoryRouter>
    );

    expect(screen.getByText('Tool Not Found')).toBeInTheDocument();
  });
});
