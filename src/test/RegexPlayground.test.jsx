import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegexPlayground } from '../features/regex-playground/RegexPlayground';
import { SAMPLE_REGEX } from '../lib/regexUtils';
import { TOOLS } from '../lib/tools-registry';

describe('RegexPlayground Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders initial UI elements, pattern inputs, and empty state notice', () => {
    render(<RegexPlayground />);

    // Header & Badge
    expect(
      screen.getByRole('heading', { level: 1, name: /Regex Playground/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Active Tool/i)).toBeInTheDocument();

    // Pattern input & test text input
    expect(screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Paste or type test text to match against/i)
    ).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: /Try Sample/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeDisabled();

    // Empty state instructions
    expect(
      screen.getByText(
        /Enter a regular expression pattern and test text above to view live highlighted matches/i
      )
    ).toBeInTheDocument();
  });

  it('loads sample regex, flags, and text when "Try Sample" is clicked', async () => {
    const user = userEvent.setup();
    render(<RegexPlayground />);

    const sampleBtn = screen.getByRole('button', { name: /Try Sample/i });
    await user.click(sampleBtn);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
    const testTextInput = screen.getByPlaceholderText(/Paste or type test text to match against/i);

    expect(patternInput.value).toBe(SAMPLE_REGEX.pattern);
    expect(testTextInput.value).toBe(SAMPLE_REGEX.testText);

    // Should find 2 matches
    expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();

    // Highlighting marks
    const marks = screen.getAllByRole('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveTextContent('dev@example.com');
    expect(marks[1]).toHaveTextContent('support@devlens.io');
  });

  it('performs live matching when pattern and text are typed manually', () => {
    render(<RegexPlayground />);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
    const testTextInput = screen.getByPlaceholderText(/Paste or type test text to match against/i);

    fireEvent.change(patternInput, { target: { value: 'foo' } });
    fireEvent.change(testTextInput, { target: { value: 'foo and foo and bar' } });

    expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();
    const marks = screen.getAllByRole('mark');
    expect(marks).toHaveLength(2);
  });

  it('displays descriptive error when invalid regex pattern is provided and dismisses via Clear Pattern button', async () => {
    const user = userEvent.setup();
    render(<RegexPlayground />);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
    const testTextInput = screen.getByPlaceholderText(/Paste or type test text to match against/i);

    fireEvent.change(testTextInput, { target: { value: 'some test text' } });
    fireEvent.change(patternInput, { target: { value: '(unclosed-bracket' } });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Regex Syntax Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix the pattern syntax error above/i)).toBeInTheDocument();

    // Click "Clear Pattern" inside the error alert
    const clearPatternBtn = screen.getByRole('button', { name: /Clear Pattern/i });
    await user.click(clearPatternBtn);

    expect(patternInput.value).toBe('');
    expect(testTextInput.value).toBe('some test text');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('recovers cleanly when an invalid pattern is edited to become a valid pattern', () => {
    render(<RegexPlayground />);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
    const testTextInput = screen.getByPlaceholderText(/Paste or type test text to match against/i);

    fireEvent.change(testTextInput, { target: { value: 'devlens toolkit' } });

    // Step 1: broken pattern
    fireEvent.change(patternInput, { target: { value: '[invalid' } });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Step 2: corrected pattern
    fireEvent.change(patternInput, { target: { value: 'toolkit' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/1 match found/i)).toBeInTheDocument();
  });

  it('toggles flags when clicking flag buttons', async () => {
    const user = userEvent.setup();
    render(<RegexPlayground />);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
    const testTextInput = screen.getByPlaceholderText(/Paste or type test text to match against/i);

    fireEvent.change(patternInput, { target: { value: 'test' } });
    fireEvent.change(testTextInput, { target: { value: 'Test and TEST' } });

    // Initially with 'g' only: case sensitive -> 0 matches
    expect(screen.getByText(/No matches found/i)).toBeInTheDocument();

    // Toggle 'i' flag
    const iFlagBtn = screen.getByRole('button', { name: 'i' });
    await user.click(iFlagBtn);

    // Now with 'gi': case insensitive -> 2 matches
    expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();

    // Toggle 'g' flag off
    const gFlagBtn = screen.getByRole('button', { name: 'g' });
    await user.click(gFlagBtn);

    // Non-global -> 1 match
    expect(screen.getByText(/1 match found/i)).toBeInTheDocument();
  });

  it('switches to match details tab and inspects captured groups', async () => {
    const user = userEvent.setup();
    render(<RegexPlayground />);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
    const testTextInput = screen.getByPlaceholderText(/Paste or type test text to match against/i);

    fireEvent.change(patternInput, { target: { value: '(\\w+)@(\\w+\\.\\w+)' } });
    fireEvent.change(testTextInput, { target: { value: 'contact user@example.com' } });

    const detailsTabBtn = screen.getByRole('button', { name: /Match Details/i });
    await user.click(detailsTabBtn);

    // Table should display match indices and capture groups
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('8..24')).toBeInTheDocument(); // range
    expect(screen.getByText('"user"')).toBeInTheDocument();
    expect(screen.getByText('"example.com"')).toBeInTheDocument();
  });

  it('clears pattern, text, and matches when clicking Clear button', async () => {
    const user = userEvent.setup();
    render(<RegexPlayground />);

    await user.click(screen.getByRole('button', { name: /Try Sample/i }));
    expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    expect(clearBtn).not.toBeDisabled();
    await user.click(clearBtn);

    const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
    const testTextInput = screen.getByPlaceholderText(/Paste or type test text to match against/i);

    expect(patternInput.value).toBe('');
    expect(testTextInput.value).toBe('');
    expect(clearBtn).toBeDisabled();
  });

  it('copies regex pattern and matches with visual feedback', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<RegexPlayground />);
    await user.click(screen.getByRole('button', { name: /Try Sample/i }));

    // Copy Pattern
    const copyPatternBtn = screen.getByRole('button', { name: /Copy regex pattern with flags/i });
    await user.click(copyPatternBtn);
    expect(writeTextMock).toHaveBeenCalledWith(`/${SAMPLE_REGEX.pattern}/${SAMPLE_REGEX.flags}`);
    expect(await screen.findByText('Copied!')).toBeInTheDocument();

    // Copy Matches in text format
    const copyMatchesBtn = screen.getByRole('button', { name: /Copy matches/i });
    await user.click(copyMatchesBtn);
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('DevLens Regex Playground Export')
    );

    // Switch export format to JSON and copy
    const formatSelect = screen.getByLabelText(/Match export format/i);
    fireEvent.change(formatSelect, { target: { value: 'json' } });
    await user.click(copyMatchesBtn);
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('"totalMatches": 2'));
  });

  it('displays error alert when clipboard copy fails', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<RegexPlayground />);
    await user.click(screen.getByRole('button', { name: /Try Sample/i }));

    const copyPatternBtn = screen.getByRole('button', { name: /Copy regex pattern with flags/i });
    await user.click(copyPatternBtn);

    await waitFor(() => {
      expect(screen.getByText(/Clipboard copy failed: Permission denied/i)).toBeInTheDocument();
    });
  });

  it('safely unmounts without error even if copy timer was triggered', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const { unmount } = render(<RegexPlayground />);
    await user.click(screen.getByRole('button', { name: /Try Sample/i }));

    const copyPatternBtn = screen.getByRole('button', { name: /Copy regex pattern with flags/i });
    await user.click(copyPatternBtn);

    expect(() => unmount()).not.toThrow();
  });

  it('is registered as an active tool in the tools registry with valid routing configuration', () => {
    const regexTool = TOOLS.find((t) => t.id === 'regex-playground');
    expect(regexTool).toBeDefined();
    expect(regexTool.status).toBe('active');
    expect(regexTool.statusLabel).toBe('Available Now');
    expect(regexTool.path).toBe('/regex-playground');
  });
});
