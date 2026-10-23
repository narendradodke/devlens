import { findMatches } from '../lib/regexUtils.js';

/**
 * Web Worker for safe, off-main-thread regular expression evaluation.
 * Protects the UI from catastrophic backtracking (ReDoS) freezing.
 */
self.onmessage = (event) => {
  if (!event || !event.data || typeof event.data !== 'object') {
    self.postMessage({ success: false, error: 'Malformed worker request payload.' });
    return;
  }

  const { id, pattern, flags, text, maxMatches } = event.data;

  try {
    const result = findMatches(pattern, flags, text, maxMatches);
    self.postMessage({ id, success: true, result });
  } catch (err) {
    self.postMessage({
      id,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
