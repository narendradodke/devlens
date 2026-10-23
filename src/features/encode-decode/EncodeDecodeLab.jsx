import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Binary,
  Sparkles,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  ArrowRightLeft,
  Shield,
  Layers,
} from 'lucide-react';
import {
  MODES,
  MODE_LABELS,
  DIRECTIONS,
  SAMPLE_TEXT,
  getUtf8ByteLength,
  transformText,
} from '../../lib/encodeDecodeUtils';

export function EncodeDecodeLab() {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState(MODES.BASE64);
  const [direction, setDirection] = useState(DIRECTIONS.ENCODE);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(null);
  const [swapFeedback, setSwapFeedback] = useState(false);

  const copiedTimeoutRef = useRef(null);
  const swapTimeoutRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    };
  }, []);

  // Compute live transformation
  const { output, error, isEmpty } = useMemo(() => {
    return transformText(inputText, mode, direction);
  }, [inputText, mode, direction]);

  // Statistics
  const inputByteLength = useMemo(() => getUtf8ByteLength(inputText), [inputText]);
  const outputByteLength = useMemo(() => getUtf8ByteLength(output), [output]);

  // Load sample text
  const handleLoadSample = useCallback(() => {
    setInputText(SAMPLE_TEXT);
    setDirection(DIRECTIONS.ENCODE);
    setCopyError(null);
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    setInputText('');
    setCopyError(null);
    setCopied(false);
  }, []);

  // Swap input and output, and reverse direction for immediate round-trip verification
  const handleSwap = useCallback(() => {
    if (!output && !inputText) return;
    setInputText(output);
    setDirection((prev) => (prev === DIRECTIONS.ENCODE ? DIRECTIONS.DECODE : DIRECTIONS.ENCODE));
    setSwapFeedback(true);
    setCopyError(null);
    if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    swapTimeoutRef.current = setTimeout(() => setSwapFeedback(false), 1500);
  }, [output, inputText]);

  // Copy output to clipboard
  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setCopyError(null);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      setCopyError(
        err instanceof Error
          ? `Clipboard copy failed: ${err.message}`
          : 'Failed to copy to clipboard. Please check browser permissions.'
      );
    }
  }, [output]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Encode / Decode Lab
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Convert between URL components, Base64, HTML entities, and Hex bytes with robust Unicode
            UTF-8 handling. Zero server calls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Sample</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!inputText && !output}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Persistent Security Disclaimer */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs">
        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Client-Side Only. Encoding is not encryption:</span>{' '}
          Base64, Hex, and URL encoding are data representations, not security controls or
          cryptographic protections. All processing occurs locally in your browser memory; no data
          is ever transmitted or persisted.
        </div>
      </div>

      {/* Controls Bar: Mode selector & Direction toggle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Mode Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Encoding Scheme</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(MODES).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    mode === m
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Direction Toggle & Swap */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDirection(DIRECTIONS.ENCODE)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  direction === DIRECTIONS.ENCODE
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Encode
              </button>
              <button
                type="button"
                onClick={() => setDirection(DIRECTIONS.DECODE)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  direction === DIRECTIONS.DECODE
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Decode
              </button>
            </div>

            <button
              type="button"
              onClick={handleSwap}
              disabled={!output && !inputText}
              title="Swap input and output and reverse direction"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{swapFeedback ? 'Swapped!' : 'Swap'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30 text-red-800 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Transformation Error: </span>
            {error}
          </div>
        </div>
      )}

      {/* Copy Error Alert */}
      {copyError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>{copyError}</span>
        </div>
      )}

      {/* Dual Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Input (
                {direction === DIRECTIONS.ENCODE ? 'Raw Text' : `${MODE_LABELS[mode]} Payload`})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {inputText.length.toLocaleString()} chars
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {inputByteLength.toLocaleString()} bytes
              </span>
            </div>
          </div>
          <div className="p-3 grow flex flex-col">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                direction === DIRECTIONS.ENCODE
                  ? 'Enter or paste raw text to encode...'
                  : `Enter or paste ${MODE_LABELS[mode]} data to decode...`
              }
              aria-label="Input payload"
              className="w-full grow h-72 min-h-[280px] p-3 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>
        </div>

        {/* Right: Output Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Output (
                {direction === DIRECTIONS.ENCODE ? `${MODE_LABELS[mode]} Output` : 'Decoded Text'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {output.length.toLocaleString()} chars
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {outputByteLength.toLocaleString()} bytes
              </span>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="p-3 grow flex flex-col">
            <textarea
              readOnly
              value={output}
              placeholder={
                isEmpty
                  ? 'Transformed output will appear here automatically...'
                  : error
                    ? 'Transformation halted due to an error above.'
                    : ''
              }
              aria-label="Transformed output"
              className="w-full grow h-72 min-h-[280px] p-3 text-xs sm:text-sm font-mono bg-slate-50/70 dark:bg-slate-950/70 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>
        </div>
      </div>

      {/* Informative Footer Details */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Binary className="w-4 h-4 text-slate-500" />
          <span>Active Scheme Details ({MODE_LABELS[mode]}):</span>
        </div>
        {mode === MODES.BASE64 && (
          <p>
            Standard Base64 (RFC 4648 §4) uses characters{' '}
            <code className="text-slate-800 dark:text-slate-200 font-mono">
              A-Z, a-z, 0-9, +, /
            </code>{' '}
            and <code className="text-slate-800 dark:text-slate-200 font-mono">=</code> padding.
            Full UTF-8 Unicode bytes are supported.
          </p>
        )}
        {mode === MODES.BASE64_URL && (
          <p>
            URL-Safe Base64 (RFC 4648 §5) replaces{' '}
            <code className="text-slate-800 dark:text-slate-200 font-mono">+</code> with{' '}
            <code className="text-slate-800 dark:text-slate-200 font-mono">-</code> and{' '}
            <code className="text-slate-800 dark:text-slate-200 font-mono">/</code> with{' '}
            <code className="text-slate-800 dark:text-slate-200 font-mono">_</code> without trailing
            padding. Safe for query strings, paths, and token claims.
          </p>
        )}
        {mode === MODES.URL_COMPONENT && (
          <p>
            URL Component percent-encodes all reserved URI characters (
            <code className="text-slate-800 dark:text-slate-200 font-mono">? &amp; = / # +</code>).
            Best for query parameter values and path components.
          </p>
        )}
        {mode === MODES.URL_FULL && (
          <p>
            Full URL preserves hierarchical protocol and path separators (
            <code className="text-slate-800 dark:text-slate-200 font-mono">:// ? &amp; # /</code>)
            while percent-encoding spaces and illegal characters.
          </p>
        )}
        {mode === MODES.HTML_ENTITIES && (
          <p>
            HTML Entities converts{' '}
            <code className="text-slate-800 dark:text-slate-200 font-mono">
              &amp; &lt; &gt; &quot; &#39;
            </code>{' '}
            into named entities and parses named, decimal, and hex entities safely without DOM
            injection.
          </p>
        )}
        {mode === MODES.HEX && (
          <p>
            Hex Bytes converts text to space-separated 2-digit UTF-8 hexadecimal bytes. Decoding
            accepts space, comma, colon, continuous, or{' '}
            <code className="text-slate-800 dark:text-slate-200 font-mono">0x</code> prefixed
            formats.
          </p>
        )}
      </div>
    </div>
  );
}
