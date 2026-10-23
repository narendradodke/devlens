import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EncodeDecodeLab } from '../features/encode-decode/EncodeDecodeLab';
import { SAMPLE_TEXT } from '../lib/encodeDecodeUtils';

describe('EncodeDecodeLab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderComponent() {
    return render(<EncodeDecodeLab />);
  }

  it('renders initial UI elements, title, security disclaimer, and default Base64 Encode mode', () => {
    renderComponent();

    expect(screen.getByText('Encode / Decode Lab')).toBeInTheDocument();
    expect(screen.getByText('Active Tool')).toBeInTheDocument();
    expect(screen.getByText(/Client-Side Only\. Encoding is not encryption:/i)).toBeInTheDocument();

    // Mode buttons
    expect(screen.getByRole('button', { name: 'Base64' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Base64URL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'URL Component' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Full URL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HTML Entities' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hex Bytes' })).toBeInTheDocument();

    // Direction buttons
    expect(screen.getByRole('button', { name: 'Encode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decode' })).toBeInTheDocument();

    // Text areas
    expect(screen.getByLabelText('Input payload')).toBeInTheDocument();
    expect(screen.getByLabelText('Transformed output')).toBeInTheDocument();
  });

  it('loads sample text when "Load Sample" button is clicked and displays Base64 output', async () => {
    const user = userEvent.setup();
    renderComponent();

    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample/i });
    await user.click(loadSampleBtn);

    const inputArea = screen.getByLabelText('Input payload');
    const outputArea = screen.getByLabelText('Transformed output');

    expect(inputArea.value).toBe(SAMPLE_TEXT);
    expect(outputArea.value).not.toBe('');
    expect(screen.getByText(/Active Scheme Details \(Base64\):/i)).toBeInTheDocument();
  });

  it('performs live encoding as user types raw text', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputArea = screen.getByLabelText('Input payload');
    const outputArea = screen.getByLabelText('Transformed output');

    await user.type(inputArea, 'Hello World');

    // 'Hello World' in Base64 is 'SGVsbG8gV29ybGQ='
    expect(outputArea.value).toBe('SGVsbG8gV29ybGQ=');
    expect(screen.getByText('11 chars')).toBeInTheDocument();
    expect(screen.getByText('11 bytes')).toBeInTheDocument();
  });

  it('switches between encoding modes dynamically', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputArea = screen.getByLabelText('Input payload');
    const outputArea = screen.getByLabelText('Transformed output');

    await user.type(inputArea, 'DevLens & Co.');

    // Switch to URL Component
    const urlCompBtn = screen.getByRole('button', { name: 'URL Component' });
    await user.click(urlCompBtn);
    expect(outputArea.value).toBe('DevLens%20%26%20Co.');

    // Switch to HTML Entities
    const htmlBtn = screen.getByRole('button', { name: 'HTML Entities' });
    await user.click(htmlBtn);
    expect(outputArea.value).toBe('DevLens &amp; Co.');

    // Switch to Hex Bytes
    const hexBtn = screen.getByRole('button', { name: 'Hex Bytes' });
    await user.click(hexBtn);
    expect(outputArea.value).toContain('44 65 76 4c 65 6e 73');
  });

  it('swaps input and output while reversing transformation direction', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputArea = screen.getByLabelText('Input payload');
    const outputArea = screen.getByLabelText('Transformed output');

    await user.type(inputArea, 'Hello DevLens');
    expect(outputArea.value).toBe('SGVsbG8gRGV2TGVucw==');

    // Click Swap
    const swapBtn = screen.getByRole('button', { name: /Swap/i });
    await user.click(swapBtn);

    // After swap: Input has the base64, direction switched to Decode, output is decoded back to 'Hello DevLens'
    expect(inputArea.value).toBe('SGVsbG8gRGV2TGVucw==');
    expect(outputArea.value).toBe('Hello DevLens');
  });

  it('displays transformation error banner when invalid payload is decoded', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Switch to Decode mode
    const decodeBtn = screen.getByRole('button', { name: 'Decode' });
    await user.click(decodeBtn);

    const inputArea = screen.getByLabelText('Input payload');
    await user.type(inputArea, 'abc');

    expect(screen.getByText(/Transformation Error:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/standard Base64 string length must be an exact multiple of 4 with padding/i)
    ).toBeInTheDocument();
  });

  it('clears all inputs, outputs, and errors when Clear button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputArea = screen.getByLabelText('Input payload');
    await user.type(inputArea, 'Some text to clear');
    expect(inputArea.value).toBe('Some text to clear');

    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    await user.click(clearBtn);

    expect(inputArea.value).toBe('');
    expect(screen.getByLabelText('Transformed output').value).toBe('');
  });

  it('copies transformed output to clipboard with feedback', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    renderComponent();

    const inputArea = screen.getByLabelText('Input payload');
    await user.type(inputArea, 'DevLens Copy Test');

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('RGV2TGVucyBDb3B5IFRlc3Q=');
    expect(screen.getByText('Copied')).toBeInTheDocument();
  });

  it('handles clipboard write failure gracefully', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    renderComponent();

    const inputArea = screen.getByLabelText('Input payload');
    await user.type(inputArea, 'DevLens Test');

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    await user.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Clipboard copy failed: Permission denied/i)).toBeInTheDocument();
    });
  });
});
