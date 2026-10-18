import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwtInspector } from '../features/jwt-inspector/JwtInspector';
import { SAMPLE_JWT } from '../lib/jwtUtils';
import { TOOLS } from '../lib/tools-registry';

describe('JwtInspector Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders the initial UI, persistent security warning banner, and empty state', () => {
    render(<JwtInspector />);

    // Header & Tool status
    expect(screen.getByRole('heading', { level: 1, name: /JWT Inspector/i })).toBeInTheDocument();
    expect(screen.getByText(/Active Tool/i)).toBeInTheDocument();

    // Persistent Security Warning
    expect(
      screen.getByText(
        /Decoding a JWT does not verify its signature or prove that the token is authentic\./i
      )
    ).toBeInTheDocument();

    // Input textarea
    expect(screen.getByPlaceholderText(/Paste your compact JWT here/i)).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: /Load Sample Token/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear Token/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear Token/i })).toBeDisabled();

    // Empty state message
    expect(
      screen.getByText(/Paste a compact JWT token above or click "Load Sample Token"/i)
    ).toBeInTheDocument();
  });

  it('loads sample token when "Load Sample Token" button is clicked and displays decoded panels', async () => {
    const user = userEvent.setup();
    render(<JwtInspector />);

    const sampleBtn = screen.getByRole('button', { name: /Load Sample Token/i });
    await user.click(sampleBtn);

    const input = screen.getByPlaceholderText(/Paste your compact JWT here/i);
    expect(input.value).toBe(SAMPLE_JWT);

    // Should display decoded sections
    expect(screen.getByText(/Standard Claims Inspection/i)).toBeInTheDocument();
    expect(screen.getByText(/Header: Algorithm & Token Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Payload: Data & Claims/i)).toBeInTheDocument();
    expect(screen.getByText(/Signature Segment \(Unverified\)/i)).toBeInTheDocument();

    // Claims content
    expect(screen.getByText('https://auth.devlens.local')).toBeInTheDocument();
    expect(screen.getByText('usr_abc12345')).toBeInTheDocument();
    expect(screen.getByText('jwt_id_987654321')).toBeInTheDocument();

    // Error alert should not exist
    expect(screen.queryByText(/Token Structure Error/i)).not.toBeInTheDocument();
  });

  it('decodes manually typed or pasted valid JWT', async () => {
    render(<JwtInspector />);

    const input = screen.getByPlaceholderText(/Paste your compact JWT here/i);
    fireEvent.change(input, { target: { value: SAMPLE_JWT } });

    expect(screen.getByText(/Standard Claims Inspection/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Decoded JWT header JSON/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Decoded JWT payload JSON/i)).toBeInTheDocument();
  });

  it('displays a descriptive error banner when invalid token is entered', () => {
    render(<JwtInspector />);

    const input = screen.getByPlaceholderText(/Paste your compact JWT here/i);
    fireEvent.change(input, { target: { value: 'invalid.token' } });

    expect(screen.getByText(/Token Structure Error/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Invalid JWT structure: Expected exactly 3 dot-separated segments/i)
    ).toBeInTheDocument();

    // Decoded panels should not be shown
    expect(screen.queryByText(/Standard Claims Inspection/i)).not.toBeInTheDocument();
  });

  it('clears token input and output when "Clear Token" button is clicked', async () => {
    const user = userEvent.setup();
    render(<JwtInspector />);

    const sampleBtn = screen.getByRole('button', { name: /Load Sample Token/i });
    await user.click(sampleBtn);

    expect(screen.getByText(/Standard Claims Inspection/i)).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /Clear Token/i });
    expect(clearBtn).not.toBeDisabled();
    await user.click(clearBtn);

    const input = screen.getByPlaceholderText(/Paste your compact JWT here/i);
    expect(input.value).toBe('');
    expect(clearBtn).toBeDisabled();

    // Should return to empty state
    expect(screen.queryByText(/Standard Claims Inspection/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Paste a compact JWT token above or click "Load Sample Token"/i)
    ).toBeInTheDocument();
  });

  it('copies decoded header, payload, and signature with feedback', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<JwtInspector />);

    await user.click(screen.getByRole('button', { name: /Load Sample Token/i }));

    // Copy Header
    const copyHeaderBtn = screen.getByRole('button', { name: /Copy decoded header JSON/i });
    await user.click(copyHeaderBtn);
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('"alg": "HS256"'));
    expect(await screen.findByText('Copied!')).toBeInTheDocument();

    // Copy Payload
    const copyPayloadBtn = screen.getByRole('button', { name: /Copy decoded payload JSON/i });
    await user.click(copyPayloadBtn);
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('"iss": "https://auth.devlens.local"')
    );

    // Copy Signature
    const copySigBtn = screen.getByRole('button', { name: /Copy encoded signature segment/i });
    await user.click(copySigBtn);
    expect(writeTextMock).toHaveBeenCalledWith('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');

    // Copy Raw Token
    const copyRawBtn = screen.getByRole('button', { name: /Copy Raw Token/i });
    await user.click(copyRawBtn);
    expect(writeTextMock).toHaveBeenCalledWith(SAMPLE_JWT);
  });

  it('displays an error alert when clipboard copy fails', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<JwtInspector />);
    await user.click(screen.getByRole('button', { name: /Load Sample Token/i }));

    const copyHeaderBtn = screen.getByRole('button', { name: /Copy decoded header JSON/i });
    await user.click(copyHeaderBtn);

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

    const { unmount } = render(<JwtInspector />);
    const sampleBtn = screen.getByRole('button', { name: /Load Sample Token/i });
    await user.click(sampleBtn);

    const copyHeaderBtn = screen.getByRole('button', { name: /Copy decoded header JSON/i });
    await user.click(copyHeaderBtn);

    // Unmount immediately while timer is ticking
    expect(() => unmount()).not.toThrow();
  });

  it('prominently marks the signature as unverified and never claims verification', async () => {
    const user = userEvent.setup();
    render(<JwtInspector />);
    await user.click(screen.getByRole('button', { name: /Load Sample Token/i }));

    expect(screen.getByText(/Signature Segment \(Unverified\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Cryptographic verification not performed/i)).toBeInTheDocument();
    expect(screen.queryByText(/Signature verified/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Token is valid and verified/i)).not.toBeInTheDocument();
  });

  it('is registered as an active tool in the tools registry with valid routing configuration', () => {
    const jwtTool = TOOLS.find((t) => t.id === 'jwt-inspector');
    expect(jwtTool).toBeDefined();
    expect(jwtTool.status).toBe('active');
    expect(jwtTool.statusLabel).toBe('Available Now');
    expect(jwtTool.path).toBe('/jwt-inspector');
  });
});
