import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JsonDiff } from '../features/json-diff/JsonDiff';
import { SAMPLE_ORIGINAL_JSON, SAMPLE_MODIFIED_JSON } from '../lib/jsonDiffUtils';
import { TOOLS } from '../lib/tools-registry';

describe('JsonDiff Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders initial dual-editor layout, empty state notice, and action buttons', () => {
    render(<JsonDiff />);

    // Header & Tool Status Badge
    expect(screen.getByRole('heading', { level: 1, name: /JSON Diff/i })).toBeInTheDocument();
    expect(screen.getByText('Active Tool')).toBeInTheDocument();

    // Editor labels
    expect(screen.getByLabelText(/Original JSON \(Left\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Modified JSON \(Right\)/i)).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: /Try Sample/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Swap/i })).toBeDisabled();

    // Empty state instruction
    expect(screen.getByText(/No JSON to Compare/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Paste or type valid JSON documents into both editors above/i)
    ).toBeInTheDocument();
  });

  it('loads sample JSON documents when "Try Sample" is clicked and renders differences', async () => {
    const user = userEvent.setup();
    render(<JsonDiff />);

    const sampleBtn = screen.getByRole('button', { name: /Try Sample/i });
    await user.click(sampleBtn);

    const leftInput = screen.getByLabelText(/Original JSON \(Left\)/i);
    const rightInput = screen.getByLabelText(/Modified JSON \(Right\)/i);

    expect(leftInput.value).toBe(SAMPLE_ORIGINAL_JSON);
    expect(rightInput.value).toBe(SAMPLE_MODIFIED_JSON);

    // Summary bar displays total differences
    expect(screen.getByText(/\d+ Differences/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Added/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /- Removed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /~ Modified/i })).toBeInTheDocument();

    // Difference cards are rendered
    expect(screen.getByText('$.version')).toBeInTheDocument();
    expect(screen.getByText('$.settings.theme')).toBeInTheDocument();
  });

  it('detects structural equivalence and displays "Documents are Structurally Identical" for matching JSON with different whitespace', () => {
    render(<JsonDiff />);

    const leftInput = screen.getByLabelText(/Original JSON \(Left\)/i);
    const rightInput = screen.getByLabelText(/Modified JSON \(Right\)/i);

    // Provide identical data with distinct whitespace and key ordering
    fireEvent.change(leftInput, {
      target: { value: '{\n  "version": 1,\n  "name": "DevLens"\n}' },
    });
    fireEvent.change(rightInput, {
      target: { value: '{"name":"DevLens","version":1}' },
    });

    expect(screen.getByText(/Documents are Structurally Identical/i)).toBeInTheDocument();
    expect(screen.getByText(/0 differences found/i)).toBeInTheDocument();
  });

  it('displays independent syntax error notice when either editor contains invalid JSON', () => {
    render(<JsonDiff />);

    const leftInput = screen.getByLabelText(/Original JSON \(Left\)/i);
    const rightInput = screen.getByLabelText(/Modified JSON \(Right\)/i);

    fireEvent.change(leftInput, { target: { value: '{ unclosed-json' } });
    fireEvent.change(rightInput, { target: { value: '{"valid": true}' } });

    expect(screen.getByText(/Original JSON Syntax Error/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Please fix the syntax error in the editor above/i)
    ).toBeInTheDocument();
  });

  it('swaps original and modified contents when "Swap" is clicked', async () => {
    const user = userEvent.setup();
    render(<JsonDiff />);

    const leftInput = screen.getByLabelText(/Original JSON \(Left\)/i);
    const rightInput = screen.getByLabelText(/Modified JSON \(Right\)/i);

    fireEvent.change(leftInput, { target: { value: '{"a": 1}' } });
    fireEvent.change(rightInput, { target: { value: '{"b": 2}' } });

    const swapBtn = screen.getByRole('button', { name: /Swap/i });
    await user.click(swapBtn);

    expect(leftInput.value).toBe('{"b": 2}');
    expect(rightInput.value).toBe('{"a": 1}');
  });

  it('clears all inputs, state, and results when "Clear" is clicked', async () => {
    const user = userEvent.setup();
    render(<JsonDiff />);

    await user.click(screen.getByRole('button', { name: /Try Sample/i }));
    expect(screen.getByText(/\d+ Differences/i)).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    expect(clearBtn).not.toBeDisabled();
    await user.click(clearBtn);

    const leftInput = screen.getByLabelText(/Original JSON \(Left\)/i);
    const rightInput = screen.getByLabelText(/Modified JSON \(Right\)/i);

    expect(leftInput.value).toBe('');
    expect(rightInput.value).toBe('');
    expect(clearBtn).toBeDisabled();
    expect(screen.getByText(/No JSON to Compare/i)).toBeInTheDocument();
  });

  it('formats original and modified JSON on click of respective Format buttons', async () => {
    const user = userEvent.setup();
    render(<JsonDiff />);

    const leftInput = screen.getByLabelText(/Original JSON \(Left\)/i);
    const rightInput = screen.getByLabelText(/Modified JSON \(Right\)/i);

    fireEvent.change(leftInput, { target: { value: '{"unformatted":1,"num":2}' } });
    fireEvent.change(rightInput, { target: { value: '{"target":true}' } });

    const formatLeftBtn = screen.getByRole('button', { name: /Format original JSON/i });
    await user.click(formatLeftBtn);

    expect(leftInput.value).toBe(JSON.stringify({ unformatted: 1, num: 2 }, null, 2));

    const formatRightBtn = screen.getByRole('button', { name: /Format modified JSON/i });
    await user.click(formatRightBtn);

    expect(rightInput.value).toBe(JSON.stringify({ target: true }, null, 2));
  });

  it('filters differences by category using filter pills', async () => {
    const user = userEvent.setup();
    render(<JsonDiff />);

    const leftInput = screen.getByLabelText(/Original JSON \(Left\)/i);
    const rightInput = screen.getByLabelText(/Modified JSON \(Right\)/i);

    fireEvent.change(leftInput, {
      target: { value: JSON.stringify({ toRemove: 'bye', toMod: 'old' }) },
    });
    fireEvent.change(rightInput, {
      target: { value: JSON.stringify({ toAdd: 'hello', toMod: 'new' }) },
    });

    expect(screen.getByText('$.toAdd')).toBeInTheDocument();
    expect(screen.getByText('$.toRemove')).toBeInTheDocument();
    expect(screen.getByText('$.toMod')).toBeInTheDocument();

    // Filter to Added only
    const addedFilterBtn = screen.getByRole('button', { name: /\+ Added/i });
    await user.click(addedFilterBtn);

    expect(screen.getByText('$.toAdd')).toBeInTheDocument();
    expect(screen.queryByText('$.toRemove')).not.toBeInTheDocument();
    expect(screen.queryByText('$.toMod')).not.toBeInTheDocument();

    // Filter to Removed only
    const removedFilterBtn = screen.getByRole('button', { name: /- Removed/i });
    await user.click(removedFilterBtn);

    expect(screen.getByText('$.toRemove')).toBeInTheDocument();
    expect(screen.queryByText('$.toAdd')).not.toBeInTheDocument();
  });

  it('filters differences by search query', async () => {
    const user = userEvent.setup();
    render(<JsonDiff />);

    await user.click(screen.getByRole('button', { name: /Try Sample/i }));

    const searchInput = screen.getByLabelText(/Filter differences by path or value/i);
    await user.type(searchInput, 'version');

    expect(screen.getByText('$.version')).toBeInTheDocument();
    expect(screen.queryByText('$.settings.theme')).not.toBeInTheDocument();
  });

  it('copies diff results in plain text and JSON with clipboard feedback', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<JsonDiff />);
    await user.click(screen.getByRole('button', { name: /Try Sample/i }));

    const copyBtn = screen.getByRole('button', { name: /Copy diff results/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('DevLens JSON Diff Report'));
    expect(await screen.findByText('Copied!')).toBeInTheDocument();

    // Switch to JSON export format
    const formatSelect = screen.getByLabelText(/Diff export format/i);
    fireEvent.change(formatSelect, { target: { value: 'json' } });

    await user.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('"tool": "DevLens JSON Diff"')
    );
  });

  it('copies individual JSONPath to clipboard', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<JsonDiff />);
    await user.click(screen.getByRole('button', { name: /Try Sample/i }));

    const copyPathBtn = screen.getByRole('button', { name: /Copy path \$\.version/i });
    await user.click(copyPathBtn);

    expect(writeTextMock).toHaveBeenCalledWith('$.version');
  });

  it('displays error alert when clipboard copy fails', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<JsonDiff />);
    await user.click(screen.getByRole('button', { name: /Try Sample/i }));

    const copyBtn = screen.getByRole('button', { name: /Copy diff results/i });
    await user.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Clipboard copy failed: Permission denied/i)).toBeInTheDocument();
    });
  });

  it('safely unmounts without error even if copy timer was active', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const { unmount } = render(<JsonDiff />);
    await user.click(screen.getByRole('button', { name: /Try Sample/i }));

    const copyBtn = screen.getByRole('button', { name: /Copy diff results/i });
    await user.click(copyBtn);

    expect(() => unmount()).not.toThrow();
  });

  it('is registered as an active tool in the tools registry with valid routing configuration', () => {
    const jsonDiffTool = TOOLS.find((t) => t.id === 'json-diff');
    expect(jsonDiffTool).toBeDefined();
    expect(jsonDiffTool.status).toBe('active');
    expect(jsonDiffTool.statusLabel).toBe('Available Now');
    expect(jsonDiffTool.path).toBe('/json-diff');
  });
});
