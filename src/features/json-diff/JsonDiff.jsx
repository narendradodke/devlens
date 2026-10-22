import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  GitCompare,
  Sparkles,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  AlignLeft,
  ArrowRightLeft,
  Search,
  Shield,
  Layers,
} from 'lucide-react';
import { formatJson, getJsonStats } from '../../lib/jsonUtils';
import {
  compareJsonStrings,
  formatDiffAsText,
  formatDiffAsJson,
  SAMPLE_ORIGINAL_JSON,
  SAMPLE_MODIFIED_JSON,
} from '../../lib/jsonDiffUtils';

export function JsonDiff() {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'added' | 'removed' | 'modified'
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFormat, setCopyFormat] = useState('text'); // 'text' | 'json'
  const [copiedSection, setCopiedSection] = useState(null); // 'diff' | path string
  const [copyError, setCopyError] = useState(null);
  const [formatFeedback, setFormatFeedback] = useState(null); // 'left' | 'right'

  const copiedTimeoutRef = useRef(null);
  const formatTimeoutRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
    };
  }, []);

  // Compute live diff
  const { diffs, isIdentical, isEmpty, truncated, leftError, rightError, stats } = useMemo(() => {
    return compareJsonStrings(leftText, rightText);
  }, [leftText, rightText]);

  // Statistics for inputs
  const leftStats = useMemo(() => getJsonStats(leftText), [leftText]);
  const rightStats = useMemo(() => getJsonStats(rightText), [rightText]);

  // Load sample JSON
  const handleLoadSample = useCallback(() => {
    setLeftText(SAMPLE_ORIGINAL_JSON);
    setRightText(SAMPLE_MODIFIED_JSON);
    setSearchQuery('');
    setTypeFilter('all');
    setCopyError(null);
  }, []);

  // Clear all inputs
  const handleClear = useCallback(() => {
    setLeftText('');
    setRightText('');
    setSearchQuery('');
    setTypeFilter('all');
    setCopyError(null);
    setCopiedSection(null);
  }, []);

  // Swap left and right inputs
  const handleSwap = useCallback(() => {
    setLeftText(rightText);
    setRightText(leftText);
  }, [leftText, rightText]);

  // Format Left JSON input
  const handleFormatLeft = useCallback(() => {
    if (!leftText.trim()) return;
    try {
      setLeftText(formatJson(leftText, 2));
      setFormatFeedback('left');
      if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
      formatTimeoutRef.current = setTimeout(() => setFormatFeedback(null), 2000);
    } catch {
      // Syntax error will already be displayed in the error banner
    }
  }, [leftText]);

  // Format Right JSON input
  const handleFormatRight = useCallback(() => {
    if (!rightText.trim()) return;
    try {
      setRightText(formatJson(rightText, 2));
      setFormatFeedback('right');
      if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
      formatTimeoutRef.current = setTimeout(() => setFormatFeedback(null), 2000);
    } catch {
      // Syntax error will already be displayed in the error banner
    }
  }, [rightText]);

  // Generic copy handler
  const handleCopy = useCallback(async (content, section) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(section);
      setCopyError(null);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => {
        setCopiedSection(null);
      }, 2000);
    } catch (err) {
      setCopyError(
        err instanceof Error
          ? `Clipboard copy failed: ${err.message}`
          : 'Failed to copy to clipboard. Please check browser permissions.'
      );
    }
  }, []);

  // Filter differences based on type filter and search query
  const filteredDiffs = useMemo(() => {
    return diffs.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPath = d.path.toLowerCase().includes(query);
        const matchesOld = d.displayOld.toLowerCase().includes(query);
        const matchesNew = d.displayNew.toLowerCase().includes(query);
        return matchesPath || matchesOld || matchesNew;
      }
      return true;
    });
  }, [diffs, typeFilter, searchQuery]);

  // Prepare full diff export payload
  const exportPayload = useMemo(() => {
    if (copyFormat === 'json') {
      return formatDiffAsJson(diffs, stats, truncated);
    }
    return formatDiffAsText(diffs, stats, truncated);
  }, [diffs, stats, truncated, copyFormat]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              JSON Diff
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare two JSON documents structurally with deep object and array traversal, JSONPath
            detection, and change badges.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Try Sample</span>
          </button>
          <button
            type="button"
            onClick={handleSwap}
            disabled={!leftText && !rightText}
            aria-label="Swap original and modified JSON"
            title="Swap original and modified documents"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!leftText && !rightText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Clipboard Global Error Notice */}
      {copyError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{copyError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCopyError(null)}
            className="font-semibold text-red-700 hover:underline dark:text-red-300 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dual JSON Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Editor: Original Document */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75">
            <div className="flex items-center gap-2">
              <label
                htmlFor="original-json-input"
                className="text-xs font-bold text-slate-900 dark:text-white"
              >
                Original JSON (Left)
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Base
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                {leftStats.lines}L · {leftStats.byteSize}B
              </span>
              <button
                type="button"
                onClick={handleFormatLeft}
                disabled={!leftText.trim()}
                title="Format original JSON with standard 2-space indentation"
                aria-label="Format original JSON"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <AlignLeft className="w-3 h-3" />
                <span>{formatFeedback === 'left' ? 'Formatted!' : 'Format'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 flex-1 flex flex-col">
            <textarea
              id="original-json-input"
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              placeholder="Paste or type original JSON document..."
              spellCheck="false"
              rows={14}
              aria-describedby={leftError ? 'left-json-syntax-error' : undefined}
              className="w-full flex-1 p-3 font-mono text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all"
            />

            {leftError && (
              <div
                id="left-json-syntax-error"
                role="alert"
                className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 space-y-0.5 animate-in fade-in duration-150"
              >
                <div className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-200">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Original JSON Syntax Error</span>
                </div>
                <p className="font-mono text-[11px] break-words pl-5">{leftError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Editor: Modified Document */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75">
            <div className="flex items-center gap-2">
              <label
                htmlFor="modified-json-input"
                className="text-xs font-bold text-slate-900 dark:text-white"
              >
                Modified JSON (Right)
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                Target
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                {rightStats.lines}L · {rightStats.byteSize}B
              </span>
              <button
                type="button"
                onClick={handleFormatRight}
                disabled={!rightText.trim()}
                title="Format modified JSON with standard 2-space indentation"
                aria-label="Format modified JSON"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <AlignLeft className="w-3 h-3" />
                <span>{formatFeedback === 'right' ? 'Formatted!' : 'Format'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 flex-1 flex flex-col">
            <textarea
              id="modified-json-input"
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              placeholder="Paste or type modified JSON document..."
              spellCheck="false"
              rows={14}
              aria-describedby={rightError ? 'right-json-syntax-error' : undefined}
              className="w-full flex-1 p-3 font-mono text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all"
            />

            {rightError && (
              <div
                id="right-json-syntax-error"
                role="alert"
                className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 space-y-0.5 animate-in fade-in duration-150"
              >
                <div className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-200">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Modified JSON Syntax Error</span>
                </div>
                <p className="font-mono text-[11px] break-words pl-5">{rightError}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Results Area */}
      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-8 text-center space-y-2">
          <GitCompare className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No JSON to Compare
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Paste or type valid JSON documents into both editors above, or click{' '}
            <button
              type="button"
              onClick={handleLoadSample}
              aria-label="Load sample documents"
              className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700 focus:outline-none"
            >
              load sample data
            </button>{' '}
            to explore differences.
          </p>
        </div>
      ) : leftError || rightError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Please fix the syntax error{leftError && rightError ? 's' : ''} in the editor
            {leftError && rightError ? 's' : ''} above to compute the structural comparison.
          </span>
        </div>
      ) : isIdentical ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-6 text-center space-y-2"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            Documents are Structurally Identical
          </h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-lg mx-auto">
            0 differences found. Whitespace, formatting, indentation, and object property key
            ordering have been normalized.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Bar & Action Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white mr-1">
                {stats.total} Difference{stats.total === 1 ? '' : 's'}
              </span>

              {/* Filter Pills */}
              <div
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg"
                role="group"
                aria-label="Filter differences by change category"
              >
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  aria-pressed={typeFilter === 'all'}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    typeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('added')}
                  aria-pressed={typeFilter === 'added'}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    typeFilter === 'added'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  + Added ({stats.added})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('removed')}
                  aria-pressed={typeFilter === 'removed'}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    typeFilter === 'removed'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  - Removed ({stats.removed})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('modified')}
                  aria-pressed={typeFilter === 'modified'}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    typeFilter === 'modified'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  ~ Modified ({stats.modified})
                </button>
              </div>
            </div>

            {/* Search and Export Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by path or value..."
                  aria-label="Filter differences by path or value"
                  className="w-full sm:w-52 pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950">
                <select
                  value={copyFormat}
                  onChange={(e) => setCopyFormat(e.target.value)}
                  aria-label="Diff export format"
                  className="text-xs bg-transparent border-0 text-slate-700 dark:text-slate-300 py-1 pl-2 pr-1 focus:outline-none font-medium"
                >
                  <option value="text">Plain Text</option>
                  <option value="json">JSON</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleCopy(exportPayload, 'diff')}
                  aria-label="Copy diff results"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {copiedSection === 'diff' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Diff</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Truncation Notice */}
          {truncated && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Comparison exceeds maximum display ceiling (5,000 differences). Display is capped to
                preserve browser performance.
              </span>
            </div>
          )}

          {/* Differences List Cards */}
          {filteredDiffs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              No differences match the current filter or search criteria.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredDiffs.map((diff, index) => {
                const isAdded = diff.type === 'added';
                const isRemoved = diff.type === 'removed';
                const isMod = diff.type === 'modified';

                return (
                  <div
                    key={diff.id}
                    className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-3.5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-400">#{index + 1}</span>

                        {isAdded && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            + ADDED
                          </span>
                        )}
                        {isRemoved && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            - REMOVED
                          </span>
                        )}
                        {isMod && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            ~ MODIFIED
                          </span>
                        )}

                        <code className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 break-all">
                          {diff.path}
                        </code>

                        {diff.isTypeChanged && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Type: {diff.oldType} → {diff.newType}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(diff.path, diff.id)}
                        title="Copy JSONPath to clipboard"
                        aria-label={`Copy path ${diff.path}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none self-start sm:self-auto"
                      >
                        {copiedSection === diff.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                              Copied!
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Copy Path</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Value Changes Box */}
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-2.5 font-mono text-xs space-y-1.5 overflow-x-auto">
                      {(isRemoved || isMod) && (
                        <div className="flex items-start gap-2 text-rose-700 dark:text-rose-400">
                          <span className="select-none font-bold text-rose-500 shrink-0">−</span>
                          <span className="break-all whitespace-pre-wrap">{diff.displayOld}</span>
                        </div>
                      )}
                      {(isAdded || isMod) && (
                        <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                          <span className="select-none font-bold text-emerald-500 shrink-0">+</span>
                          <span className="break-all whitespace-pre-wrap">{diff.displayNew}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Security & Performance Footer Notice */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>100% Client-Side Evaluation:</strong> JSON documents are compared in-memory. No
            data is ever sent over the network or persisted to browser storage.
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono shrink-0 pl-2">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>Depth-Safe AST Traversal</span>
        </div>
      </div>
    </div>
  );
}
export default JsonDiff;
