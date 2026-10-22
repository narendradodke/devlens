import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Regex,
  Sparkles,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';
import {
  SUPPORTED_FLAGS,
  SAMPLE_REGEX,
  sanitizeFlags,
  findMatches,
  getHighlightSegments,
  formatMatchesAsText,
  formatMatchesAsJson,
} from '../../lib/regexUtils';

export function RegexPlayground() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('');
  const [activeTab, setActiveTab] = useState('highlight'); // 'highlight' | 'details'
  const [copyFormat, setCopyFormat] = useState('text'); // 'text' | 'json'
  const [copiedSection, setCopiedSection] = useState(null); // 'pattern' | 'matches'
  const [copyError, setCopyError] = useState(null);

  const copiedTimeoutRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  // Live match derivation
  const { matches, error, truncated } = useMemo(() => {
    return findMatches(pattern, flags, testText);
  }, [pattern, flags, testText]);

  // Derived highlighted text segments
  const highlightSegments = useMemo(() => {
    if (!testText) return [];
    return getHighlightSegments(testText, matches);
  }, [testText, matches]);

  // Toggle individual regex flags (g, i, m, s)
  const toggleFlag = useCallback((flagChar) => {
    setFlags((prevFlags) => {
      const set = new Set(prevFlags.split(''));
      if (set.has(flagChar)) {
        set.delete(flagChar);
      } else {
        set.add(flagChar);
      }
      return sanitizeFlags(Array.from(set).join(''));
    });
  }, []);

  // Load built-in email sample
  const handleLoadSample = useCallback(() => {
    setPattern(SAMPLE_REGEX.pattern);
    setFlags(SAMPLE_REGEX.flags);
    setTestText(SAMPLE_REGEX.testText);
    setCopyError(null);
  }, []);

  // Clear inputs and state
  const handleClear = useCallback(() => {
    setPattern('');
    setTestText('');
    setCopyError(null);
    setCopiedSection(null);
  }, []);

  // Generic copy handler
  const handleCopy = useCallback(async (content, section) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(section);
      setCopyError(null);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
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

  // Prepare matches copy content
  const matchesCopyPayload = useMemo(() => {
    if (copyFormat === 'json') {
      return formatMatchesAsJson(matches, pattern, flags, truncated);
    }
    return formatMatchesAsText(matches, pattern, flags, truncated);
  }, [matches, pattern, flags, copyFormat, truncated]);

  const activeFlagsList = flags.split('');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Regex Playground
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Test and inspect regular expressions in real-time with safe React match highlighting and
            detailed capture group inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={handleClear}
            disabled={!pattern && !testText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Pattern Input Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label
            htmlFor="regex-pattern-input"
            className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5"
          >
            <Regex className="w-4 h-4 text-blue-500" />
            <span>Regular Expression Pattern</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Flags:</span>
            <div
              className="flex items-center gap-1"
              role="group"
              aria-label="Regular expression flags"
            >
              {SUPPORTED_FLAGS.map(({ flag, label, description }) => {
                const isActive = activeFlagsList.includes(flag);
                return (
                  <button
                    key={flag}
                    type="button"
                    role="button"
                    aria-pressed={isActive}
                    title={`${label}: ${description}`}
                    onClick={() => toggleFlag(flag)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs dark:bg-blue-600 dark:border-blue-500'
                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                    }`}
                  >
                    {flag}
                  </button>
                );
              })}
            </div>
            {pattern && (
              <button
                type="button"
                onClick={() => handleCopy(`/${pattern}/${flags}`, 'pattern')}
                aria-label="Copy regex pattern with flags"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              >
                {copiedSection === 'pattern' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Pattern Input Box with Regex slashes */}
        <div className="flex items-center rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden px-3 py-2">
          <span className="text-sm font-mono text-slate-400 select-none pr-1">/</span>
          <input
            id="regex-pattern-input"
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. [A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}"
            spellCheck="false"
            aria-describedby={error ? 'regex-syntax-error' : undefined}
            className="w-full bg-transparent font-mono text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <span className="text-sm font-mono text-slate-400 select-none pl-1">/{flags}</span>
        </div>

        {/* Syntax Error Notice */}
        {error && (
          <div
            id="regex-syntax-error"
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 space-y-1 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>Regex Syntax Error</span>
              </div>
              <button
                type="button"
                onClick={() => setPattern('')}
                className="text-[11px] font-semibold text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100 hover:underline focus:outline-none"
              >
                Clear Pattern
              </button>
            </div>
            <p className="font-mono text-[11px] break-words pl-5">{error}</p>
          </div>
        )}
      </div>

      {/* Test Text Input Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="regex-test-text-input"
            className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Test Text</span>
          </label>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
            <span>{testText.length} characters</span>
            <span>•</span>
            <span>{testText ? testText.split('\n').length : 0} lines</span>
          </div>
        </div>

        <textarea
          id="regex-test-text-input"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Paste or type test text to match against..."
          spellCheck="false"
          rows={5}
          className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Results Header & Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Match Results</span>
            </span>

            {/* Match Counter Badge */}
            {pattern && testText && !error ? (
              <span
                role="status"
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  matches.length > 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
                {truncated && ' (capped at 5,000)'}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('highlight')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'highlight'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Highlighted Text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'details'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Match Details ({matches.length})
              </button>
            </div>

            {/* Export matches button */}
            {matches.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <select
                  value={copyFormat}
                  onChange={(e) => setCopyFormat(e.target.value)}
                  aria-label="Match export format"
                  className="text-xs py-1 px-2 rounded-lg border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="text">Plain Text</option>
                  <option value="json">JSON</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleCopy(matchesCopyPayload, 'matches')}
                  aria-label="Copy matches"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors"
                >
                  {copiedSection === 'matches' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Matches</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clipboard error banner */}
        {copyError && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <p>{copyError}</p>
          </div>
        )}

        {/* Tab 1: Highlighted Text */}
        {activeTab === 'highlight' && (
          <div className="p-5">
            {!pattern || !testText ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {!pattern && !testText
                    ? 'Enter a regular expression pattern and test text above to view live highlighted matches.'
                    : !pattern
                      ? 'Enter a regular expression pattern to execute matches.'
                      : 'Enter test text above to evaluate your regular expression.'}
                </p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-dashed border-red-300 p-8 text-center dark:border-red-800">
                <p className="text-xs text-red-500 dark:text-red-400">
                  Fix the pattern syntax error above to view match highlights.
                </p>
              </div>
            ) : matches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No matches found for the pattern in the test text.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all select-text">
                {highlightSegments.map((segment) => {
                  if (segment.isMatch) {
                    if (segment.isZeroLength) {
                      return (
                        <span
                          key={segment.key}
                          title={`Zero-length Match #${segment.matchNumber}`}
                          className="inline-block w-1.5 h-3.5 bg-amber-400 dark:bg-amber-300 align-middle mx-0.5 rounded-xs"
                          aria-label={`Zero-length match ${segment.matchNumber}`}
                        />
                      );
                    }
                    return (
                      <mark
                        key={segment.key}
                        title={`Match #${segment.matchNumber}`}
                        className="bg-amber-200 text-amber-950 dark:bg-amber-500/35 dark:text-amber-100 font-semibold px-0.5 rounded-xs border-b-2 border-amber-500 dark:border-amber-400"
                      >
                        {segment.text}
                      </mark>
                    );
                  }
                  return <span key={segment.key}>{segment.text}</span>;
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Detailed Match Inspection */}
        {activeTab === 'details' && (
          <div className="p-5">
            {matches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {!pattern || !testText
                    ? 'Enter pattern and test text to inspect match indices and capture groups.'
                    : 'No matches to display.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Matched Text</th>
                        <th className="py-2.5 px-3">Range</th>
                        <th className="py-2.5 px-3">Length</th>
                        <th className="py-2.5 px-3">Capturing Groups</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {matches.map((m) => (
                        <tr
                          key={m.matchNumber}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 font-mono transition-colors"
                        >
                          <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                            {m.matchNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-xs break-all">
                            {m.match.length === 0 ? (
                              <span className="italic text-slate-400 font-sans font-normal">
                                (zero-length match)
                              </span>
                            ) : (
                              m.match
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                            {m.index}..{m.endIndex}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                            {m.match.length}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-[11px]">
                            {m.groups && m.groups.length > 0 ? (
                              <div className="space-y-1">
                                {m.groups.map((grp, gIdx) => (
                                  <div key={gIdx} className="flex items-center gap-1.5">
                                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-sans">
                                      Group {gIdx + 1}:
                                    </span>
                                    <span className="text-slate-900 dark:text-slate-100">
                                      {grp !== undefined ? `"${grp}"` : '<undefined>'}
                                    </span>
                                  </div>
                                ))}
                                {m.namedGroups &&
                                  Object.entries(m.namedGroups).map(([name, val]) => (
                                    <div key={name} className="flex items-center gap-1.5">
                                      <span className="text-[10px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-sans">
                                        Named &quot;{name}&quot;:
                                      </span>
                                      <span className="text-slate-900 dark:text-slate-100">
                                        {val !== undefined ? `"${val}"` : '<undefined>'}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-sans italic text-[10px]">
                                None
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security & ReDoS Notice Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 shadow-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Privacy & Engine Performance Notice</span>
        </div>
        <p className="leading-relaxed">
          Regular expressions execute entirely in your local browser tab using native JavaScript
          RegExp with zero server calls. Notice: The 5,000-match display ceiling guards against UI
          memory exhaustion, but does <em>not</em> prevent catastrophic backtracking (ReDoS).
          Exponential patterns (such as nested quantifiers like{' '}
          <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">
            (a+)+$
          </code>
          ) run synchronously and can freeze the browser tab. Avoid testing unconstrained
          exponential expressions on large inputs.
        </p>
      </div>
    </div>
  );
}

export default RegexPlayground;
