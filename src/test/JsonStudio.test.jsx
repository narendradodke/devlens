import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JsonStudio } from '../features/json-studio/JsonStudio';

describe('JsonStudio Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders the editor inputs and action buttons including Validate', () => {
    render(<JsonStudio />);
    expect(screen.getByText('JSON Studio')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste or type your raw JSON here/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Formatted or minified output will appear here/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Format/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Minify/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Validate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
  });

  it('formats valid JSON when Format button is clicked', async () => {
    const user = userEvent.setup();
    render(<JsonStudio />);

    const input = screen.getByPlaceholderText(/Paste or type your raw JSON here/i);
    fireEvent.change(input, { target: { value: '{"hello":"world"}' } });

    const formatBtn = screen.getByRole('button', { name: /Format/i });
    await user.click(formatBtn);

    const output = screen.getByPlaceholderText(/Formatted or minified output will appear here/i);
    expect(output.value).toBe('{\n  "hello": "world"\n}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('minifies valid JSON when Minify button is clicked', async () => {
    const user = userEvent.setup();
    render(<JsonStudio />);

    const input = screen.getByPlaceholderText(/Paste or type your raw JSON here/i);
    fireEvent.change(input, { target: { value: '{\n  "a": 1,\n  "b": 2\n}' } });

    const minifyBtn = screen.getByRole('button', { name: /Minify/i });
    await user.click(minifyBtn);

    const output = screen.getByPlaceholderText(/Formatted or minified output will appear here/i);
    expect(output.value).toBe('{"a":1,"b":2}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('validates valid JSON and displays a green status confirmation', async () => {
    const user = userEvent.setup();
    render(<JsonStudio />);

    const input = screen.getByPlaceholderText(/Paste or type your raw JSON here/i);
    fireEvent.change(input, { target: { value: '{"valid": true, "count": 10}' } });

    const validateBtn = screen.getByRole('button', { name: /Validate/i });
    await user.click(validateBtn);

    const statusAlert = screen.getByRole('status');
    expect(statusAlert).toBeInTheDocument();
    expect(statusAlert).toHaveTextContent(/Valid JSON syntax/i);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an alert box with the exact error on invalid JSON without crashing', async () => {
    const user = userEvent.setup();
    render(<JsonStudio />);

    const input = screen.getByPlaceholderText(/Paste or type your raw JSON here/i);
    fireEvent.change(input, { target: { value: '{"invalid": json}' } });

    const formatBtn = screen.getByRole('button', { name: /Format/i });
    await user.click(formatBtn);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/JSON Syntax Error/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows validation error when Validate is clicked with empty input', async () => {
    const user = userEvent.setup();
    render(<JsonStudio />);

    const validateBtn = screen.getByRole('button', { name: /Validate/i });
    await user.click(validateBtn);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Please enter some JSON to validate/i);
  });

  it('clears all input, output, validation message, and errors when Clear is clicked', async () => {
    const user = userEvent.setup();
    render(<JsonStudio />);

    const input = screen.getByPlaceholderText(/Paste or type your raw JSON here/i);
    fireEvent.change(input, { target: { value: '{"x": 1}' } });

    const validateBtn = screen.getByRole('button', { name: /Validate/i });
    await user.click(validateBtn);
    expect(screen.getByRole('status')).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    await user.click(clearBtn);

    expect(input.value).toBe('');
    const output = screen.getByPlaceholderText(/Formatted or minified output will appear here/i);
    expect(output.value).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('loads sample JSON when clicking Load Sample button', async () => {
    const user = userEvent.setup();
    render(<JsonStudio />);

    const sampleBtn = screen.getByRole('button', { name: /Load Sample JSON/i });
    await user.click(sampleBtn);

    const input = screen.getByPlaceholderText(/Paste or type your raw JSON here/i);
    expect(input.value).toContain('DevLens Toolkit');

    const output = screen.getByPlaceholderText(/Formatted or minified output will appear here/i);
    expect(output.value).toContain('DevLens Toolkit');
  });

  it('copies output to clipboard and shows temporary Copied feedback', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<JsonStudio />);

    const sampleBtn = screen.getByRole('button', { name: /Load Sample JSON/i });
    await user.click(sampleBtn);

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });

  it('displays honest error message when clipboard copy fails', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<JsonStudio />);

    const sampleBtn = screen.getByRole('button', { name: /Load Sample JSON/i });
    await user.click(sampleBtn);

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    await user.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Permission denied/i);
    });
  });

  it('triggers download with temporary Blob URL and schedules revocation', async () => {
    const user = userEvent.setup();
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<JsonStudio />);

    const sampleBtn = screen.getByRole('button', { name: /Load Sample JSON/i });
    await user.click(sampleBtn);

    const downloadBtn = screen.getByRole('button', { name: /Download JSON/i });
    await user.click(downloadBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();

    await waitFor(
      () => {
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
      },
      { timeout: 2000 }
    );
  });

  it('safely unmounts without error even if copy timer was triggered', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const { unmount } = render(<JsonStudio />);

    const sampleBtn = screen.getByRole('button', { name: /Load Sample JSON/i });
    await user.click(sampleBtn);

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    await user.click(copyBtn);

    // Unmount immediately while timer is ticking
    expect(() => unmount()).not.toThrow();
  });
});
