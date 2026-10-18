import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AlignLeft,
  Minimize2,
  CheckCircle,
  Copy,
  Check,
  Download,
  Trash2,
  AlertCircle,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { formatJson, minifyJson, validateJson, getJsonStats } from '../../lib/jsonUtils';

const SAMPLE_JSON = JSON.stringify(
  {
    name: 'DevLens Toolkit',
    version: '1.0.0',
    privacy: {
      inBrowserOnly: true,
      telemetry: false,
      storage: 'none',
    },
    tools: ['JSON Studio', 'JWT Inspector', 'Regex Playground', 'JSON Diff', 'Encode/Decode'],
    activeUsers: 42,
    metadata: {
      tags: ['open-source', 'privacy', 'developer-tools'],
      license: 'MIT',
    },
  },
  null,
  2
);

export function JsonStudio() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [validationSuccess, setValidationSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null); // 'formatted' | 'minified' | 'validated'

  const copiedTimeoutRef = useRef(null);
  const downloadTimeoutRef = useRef(null);

  // Clean up timers on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
      }
    };
  }, []);

  const inputStats = getJsonStats(input);
  const outputStats = getJsonStats(output);

  // Format JSON
  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter some JSON to format.');
      setValidationSuccess(null);
      setOutput('');
      return;
    }
    try {
      const formatted = formatJson(input, 2);
      setOutput(formatted);
      setError(null);
      setValidationSuccess(null);
      setLastAction('formatted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON syntax');
      setValidationSuccess(null);
      setOutput('');
    }
  }, [input]);

  // Minify JSON
  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter some JSON to minify.');
      setValidationSuccess(null);
      setOutput('');
      return;
    }
    try {
      const minified = minifyJson(input);
      setOutput(minified);
      setError(null);
      setValidationSuccess(null);
      setLastAction('minified');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON syntax');
      setValidationSuccess(null);
      setOutput('');
    }
  }, [input]);

  // Validate JSON
  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter some JSON to validate.');
      setValidationSuccess(null);
      return;
    }

    const result = validateJson(input);
    if (result.isValid) {
      setValidationSuccess(result.message);
      setError(null);
      setLastAction('validated');
    } else {
      setError(result.error);
      setValidationSuccess(null);
    }
  }, [input]);

  // Clear everything
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setValidationSuccess(null);
    setCopied(false);
    setLastAction(null);
  }, []);

  // Load sample JSON
  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_JSON);
    setError(null);
    setValidationSuccess(null);
    try {
      const formatted = formatJson(SAMPLE_JSON, 2);
      setOutput(formatted);
      setLastAction('formatted');
    } catch {
      // Sample is static and valid
    }
  }, []);

  // Copy output to clipboard
  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to copy: ${err.message}`
          : 'Failed to copy to clipboard. Please check browser permissions.'
      );
    }
  }, [output]);

  // Download output as .json file
  const handleDownload = useCallback(() => {
    if (!output) return;
    try {
      const filename = lastAction === 'minified' ? 'minified.json' : 'formatted.json';
      const blob = new Blob([output], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Safe cleanup: revoke after 1 second so browser download manager has completed reading
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
      }
      downloadTimeoutRef.current = setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Download failed: ${err.message}`
          : 'Failed to trigger file download.'
      );
    }
  }, [output, lastAction]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              JSON Studio
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Format, minify, validate, and download JSON entirely in your browser with zero server
            calls.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Load Sample JSON</span>
        </button>
      </div>

      {/* Main Dual-Pane Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="json-input"
              className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
            >
              <FileCode className="w-4 h-4 text-slate-500" />
              <span>Input JSON</span>
            </label>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
              <span>{inputStats.characters} chars</span>
              <span>•</span>
              <span>{inputStats.lines} lines</span>
              <span>•</span>
              <span>{inputStats.byteSize} bytes</span>
            </div>
          </div>

          <div className="relative flex-1">
            <textarea
              id="json-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
                if (validationSuccess) setValidationSuccess(null);
              }}
              placeholder='Paste or type your raw JSON here... e.g. {"name": "DevLens", "privacy": true}'
              spellCheck="false"
              aria-describedby={
                error
                  ? 'json-syntax-error'
                  : validationSuccess
                    ? 'json-validation-status'
                    : undefined
              }
              className={`w-full h-80 sm:h-96 p-3.5 font-mono text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all resize-y ${
                error
                  ? 'border-red-400 focus:ring-red-500 dark:border-red-600'
                  : validationSuccess
                    ? 'border-emerald-400 focus:ring-emerald-500 dark:border-emerald-600'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              }`}
            />
          </div>

          {/* Action Toolbar for Input */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleFormat}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition-colors"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Format</span>
            </button>

            <button
              type="button"
              onClick={handleMinify}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Minify</span>
            </button>

            <button
              type="button"
              onClick={handleValidate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Validate</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={!input && !output && !error && !validationSuccess}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Validation Success Alert Box */}
          {validationSuccess && (
            <div
              id="json-validation-status"
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 space-y-1 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>JSON Syntax Valid</span>
              </div>
              <p className="font-mono text-[11px] break-words pl-5">{validationSuccess}</p>
            </div>
          )}

          {/* Error Message Alert Box */}
          {error && (
            <div
              id="json-syntax-error"
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 space-y-1 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>JSON Syntax Error</span>
              </div>
              <p className="font-mono text-[11px] break-words pl-5">{error}</p>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="json-output"
              className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
            >
              <FileCode className="w-4 h-4 text-emerald-500" />
              <span>Output JSON</span>
              {lastAction && (
                <span className="text-[10px] font-normal text-slate-500">
                  (
                  {lastAction === 'formatted'
                    ? '2-space indentation'
                    : lastAction === 'minified'
                      ? 'minified single line'
                      : 'validated'}
                  )
                </span>
              )}
            </label>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
              <span>{outputStats.characters} chars</span>
              <span>•</span>
              <span>{outputStats.lines} lines</span>
              <span>•</span>
              <span>{outputStats.byteSize} bytes</span>
            </div>
          </div>

          <div className="relative flex-1">
            <textarea
              id="json-output"
              value={output}
              readOnly
              placeholder="Formatted or minified output will appear here..."
              spellCheck="false"
              className="w-full h-80 sm:h-96 p-3.5 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
            />
          </div>

          {/* Action Toolbar for Output */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!output}
              aria-label={copied ? 'Output copied to clipboard' : 'Copy output JSON to clipboard'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!output}
              aria-label="Download JSON file to local disk"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JsonStudio;
