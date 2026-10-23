import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  describe('Web Worker Execution Safety, Timeout & Stale Result Prevention', () => {
    let originalWorker;

    beforeEach(() => {
      originalWorker = globalThis.Worker;
    });

    afterEach(() => {
      globalThis.Worker = originalWorker;
      vi.useRealTimers();
    });

    it('terminates worker and displays timeout error message on ReDoS timeout', () => {
      vi.useFakeTimers();

      let workerInstance;
      class MockHangingWorker {
        constructor() {
          this.terminate = vi.fn();
          this.postMessage = vi.fn(); // Never posts back message, simulating ReDoS
          workerInstance = this;
        }
      }
      globalThis.Worker = MockHangingWorker;

      render(<RegexPlayground />);

      const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
      const testTextInput = screen.getByPlaceholderText(
        /Paste or type test text to match against/i
      );

      fireEvent.change(patternInput, { target: { value: '(a+)+$' } });
      fireEvent.change(testTextInput, { target: { value: 'aaaaaaaaaaaaaaaaaaaaa!' } });

      // Fast-forward past DEFAULT_REGEX_TIMEOUT_MS (2000ms)
      act(() => {
        vi.advanceTimersByTime(2100);
      });

      expect(workerInstance.terminate).toHaveBeenCalled();
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/Regex execution timed out/i);
      expect(alert).toHaveTextContent(/catastrophic backtracking \(ReDoS\)/i);
    });

    it('ignores stale worker results when input changes before worker completes', () => {
      const workerInstances = [];
      class MockDelayedWorker {
        constructor() {
          this.terminate = vi.fn();
          this.postMessage = vi.fn();
          workerInstances.push(this);
        }
      }
      globalThis.Worker = MockDelayedWorker;

      render(<RegexPlayground />);

      const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
      const testTextInput = screen.getByPlaceholderText(
        /Paste or type test text to match against/i
      );

      // First input change (dispatching request)
      fireEvent.change(patternInput, { target: { value: 'first' } });
      fireEvent.change(testTextInput, { target: { value: 'first and second' } });

      const firstWorker = workerInstances[workerInstances.length - 1];

      // Second input change immediately (updates pattern to 'second')
      fireEvent.change(patternInput, { target: { value: 'second' } });

      const secondWorker = workerInstances[workerInstances.length - 1];

      // Simulate first worker responding late with stale result for request id 1
      act(() => {
        firstWorker.onmessage?.({
          data: {
            id: 1, // Stale request ID
            success: true,
            result: {
              matches: [
                {
                  match: 'first',
                  matchNumber: 1,
                  index: 0,
                  endIndex: 5,
                  groups: [],
                  namedGroups: null,
                },
              ],
              error: null,
              truncated: false,
            },
          },
        });
      });

      // Second worker responds with current request id 2
      act(() => {
        secondWorker.onmessage?.({
          data: {
            id: 2,
            success: true,
            result: {
              matches: [
                {
                  match: 'second',
                  matchNumber: 1,
                  index: 10,
                  endIndex: 16,
                  groups: [],
                  namedGroups: null,
                },
              ],
              error: null,
              truncated: false,
            },
          },
        });
      });

      expect(screen.getByText(/1 match found/i)).toBeInTheDocument();
    });

    it('terminates active worker when component unmounts', () => {
      let workerInstance;
      class MockWorker {
        constructor() {
          this.terminate = vi.fn();
          this.postMessage = vi.fn();
          workerInstance = this;
        }
      }
      globalThis.Worker = MockWorker;

      const { unmount } = render(<RegexPlayground />);
      const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
      const testTextInput = screen.getByPlaceholderText(
        /Paste or type test text to match against/i
      );

      fireEvent.change(patternInput, { target: { value: 'abc' } });
      fireEvent.change(testTextInput, { target: { value: 'abcdef' } });

      unmount();

      expect(workerInstance.terminate).toHaveBeenCalled();
    });

    it('displays error for pattern exceeding maximum size limit', () => {
      render(<RegexPlayground />);
      const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
      const testTextInput = screen.getByPlaceholderText(
        /Paste or type test text to match against/i
      );

      fireEvent.change(testTextInput, { target: { value: 'some test text' } });
      fireEvent.change(patternInput, { target: { value: 'a'.repeat(5001) } });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Pattern exceeds maximum allowed length/i)).toBeInTheDocument();
    });

    it('shows clear error and prevents synchronous fallback when worker creation fails', () => {
      globalThis.Worker = undefined; // Simulate environment where workers are unavailable

      render(<RegexPlayground />);
      const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
      const testTextInput = screen.getByPlaceholderText(
        /Paste or type test text to match against/i
      );

      fireEvent.change(patternInput, { target: { value: 'test' } });
      fireEvent.change(testTextInput, { target: { value: 'test input' } });

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/Web Workers are unavailable or failed to initialize/i);
      expect(alert).toHaveTextContent(
        /cannot be safely evaluated without background worker isolation/i
      );
      expect(screen.queryByText(/1 match found/i)).not.toBeInTheDocument();
    });

    it('handles worker runtime error event gracefully without permanent loading state', () => {
      let workerInstance;
      class MockErrorWorker {
        constructor() {
          this.terminate = vi.fn();
          this.postMessage = vi.fn();
          workerInstance = this;
        }
      }
      globalThis.Worker = MockErrorWorker;

      render(<RegexPlayground />);
      const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
      const testTextInput = screen.getByPlaceholderText(
        /Paste or type test text to match against/i
      );

      fireEvent.change(patternInput, { target: { value: 'abc' } });
      fireEvent.change(testTextInput, { target: { value: 'abcdef' } });

      act(() => {
        workerInstance.onerror?.({ message: 'Script error inside worker.' });
      });

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/Script error inside worker/i);
      expect(screen.queryByText(/Evaluating\.\.\./i)).not.toBeInTheDocument();
    });

    it('handles malformed worker message gracefully without throwing or locking UI', () => {
      let workerInstance;
      class MockMalformedWorker {
        constructor() {
          this.terminate = vi.fn();
          this.postMessage = vi.fn();
          workerInstance = this;
        }
      }
      globalThis.Worker = MockMalformedWorker;

      render(<RegexPlayground />);
      const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
      const testTextInput = screen.getByPlaceholderText(
        /Paste or type test text to match against/i
      );

      fireEvent.change(patternInput, { target: { value: 'abc' } });
      fireEvent.change(testTextInput, { target: { value: 'abcdef' } });

      act(() => {
        workerInstance.onmessage?.(null);
      });

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/Worker returned a malformed response/i);
      expect(screen.queryByText(/Evaluating\.\.\./i)).not.toBeInTheDocument();
    });

    it('recovers cleanly and resets error when user edits pattern after a worker failure', () => {
      const workerInstances = [];
      class MockFailThenSucceedWorker {
        constructor() {
          this.terminate = vi.fn();
          this.postMessage = vi.fn();
          workerInstances.push(this);
        }
      }
      globalThis.Worker = MockFailThenSucceedWorker;

      render(<RegexPlayground />);
      const patternInput = screen.getByPlaceholderText(/e\.g\. \[A-Z0-9\._%\+-\]\+/i);
      const testTextInput = screen.getByPlaceholderText(
        /Paste or type test text to match against/i
      );

      // Step 1: trigger failing evaluation
      fireEvent.change(patternInput, { target: { value: 'bad' } });
      fireEvent.change(testTextInput, { target: { value: 'bad and good' } });

      const firstWorker = workerInstances[workerInstances.length - 1];
      act(() => {
        firstWorker.onerror?.({ message: 'Initial worker failure.' });
      });

      expect(screen.getByRole('alert')).toHaveTextContent(/Initial worker failure/i);

      // Step 2: edit pattern and simulate successful worker evaluation
      fireEvent.change(patternInput, { target: { value: 'good' } });
      const secondWorker = workerInstances[workerInstances.length - 1];

      act(() => {
        secondWorker.onmessage?.({
          data: {
            id: 2,
            success: true,
            result: {
              matches: [
                {
                  match: 'good',
                  matchNumber: 1,
                  index: 8,
                  endIndex: 12,
                  groups: [],
                  namedGroups: null,
                },
              ],
              error: null,
              truncated: false,
            },
          },
        });
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText(/1 match found/i)).toBeInTheDocument();
    });
  });
});
