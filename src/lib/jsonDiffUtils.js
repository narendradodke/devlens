/**
 * Pure JSON Diff utility functions for DevLens JSON Diff.
 * All operations execute in-memory in the browser without external dependencies or backend calls.
 */

/**
 * Built-in realistic sample JSON pair demonstrating added, removed,
 * modified primitives, nested objects, and array mutations.
 */
export const SAMPLE_ORIGINAL_JSON = JSON.stringify(
  {
    name: 'DevLens',
    version: '1.0.0',
    description: 'Privacy-First Developer Toolkit',
    license: 'MIT',
    author: {
      name: 'Narendra Dodke',
      verified: true,
      role: 'Maintainer',
    },
    settings: {
      telemetry: false,
      theme: 'system',
      cacheTimeoutMs: 3600,
      notifications: {
        email: true,
        desktop: false,
      },
    },
    tags: ['developer', 'privacy', 'toolkit', 'offline'],
    activeTools: [
      { id: 'json-studio', name: 'JSON Studio', status: 'active' },
      { id: 'jwt-inspector', name: 'JWT Inspector', status: 'active' },
      { id: 'regex-playground', name: 'Regex Playground', status: 'active' },
    ],
    deprecatedApiVersion: 1,
  },
  null,
  2
);

export const SAMPLE_MODIFIED_JSON = JSON.stringify(
  {
    name: 'DevLens',
    version: '1.1.0',
    description: 'Secure, Privacy-First Developer Toolkit for Modern Web Developers',
    license: 'MIT',
    author: {
      name: 'Narendra Dodke',
      verified: true,
      role: 'Lead Architect',
    },
    settings: {
      telemetry: false,
      theme: 'dark',
      cacheTimeoutMs: 7200,
      notifications: {
        email: false,
        desktop: true,
      },
      autoSave: true,
    },
    tags: ['privacy', 'toolkit', 'developer', 'utilities', 'browser-only'],
    activeTools: [
      { id: 'json-studio', name: 'JSON Studio', status: 'active' },
      { id: 'jwt-inspector', name: 'JWT Inspector', status: 'active' },
      { id: 'regex-playground', name: 'Regex Playground', status: 'active' },
      { id: 'json-diff', name: 'JSON Diff', status: 'active' },
    ],
  },
  null,
  2
);

/**
 * Returns a precise type string for any JSON-compatible value.
 *
 * @param {unknown} val
 * @returns {'null' | 'array' | 'object' | 'string' | 'number' | 'boolean' | 'undefined'}
 */
export function getJsonValueType(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

/**
 * Default limits and bounds for JSON diff operations.
 */
export const DEFAULT_MAX_DIFFS = 5000;
export const DEFAULT_MAX_DEPTH = 50;
export const UPPER_MAX_DIFFS = 50000;
export const UPPER_MAX_DEPTH = 1000;
export const MAX_JSON_DIFF_INPUT_LENGTH = 5000000;

/**
 * Safely normalizes maxDiffs option to a finite non-negative integer.
 *
 * @param {unknown} value
 * @param {number} [defaultValue=5000]
 * @param {number} [maxBound=50000]
 * @returns {number}
 */
export function normalizeLimit(
  value,
  defaultValue = DEFAULT_MAX_DIFFS,
  maxBound = UPPER_MAX_DIFFS
) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return defaultValue;
  }
  if (!Number.isFinite(value)) {
    return value > 0 ? maxBound : 0;
  }
  const intVal = Math.floor(value);
  return Math.max(0, Math.min(intVal, maxBound));
}

/**
 * Safely normalizes maxDepth option to a finite non-negative integer.
 *
 * @param {unknown} value
 * @param {number} [defaultValue=50]
 * @param {number} [maxBound=1000]
 * @returns {number}
 */
export function normalizeDepth(
  value,
  defaultValue = DEFAULT_MAX_DEPTH,
  maxBound = UPPER_MAX_DEPTH
) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return defaultValue;
  }
  if (!Number.isFinite(value)) {
    return value > 0 ? maxBound : 0;
  }
  const intVal = Math.floor(value);
  return Math.max(0, Math.min(intVal, maxBound));
}

/**
 * Checks if two values are structurally and deeply equal without regard to object key ordering.
 * Uses an iterative stack-based traversal to prevent call stack overflow on deeply nested JSON.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function isDeepEqual(a, b) {
  if (Object.is(a, b)) return true;

  const stack = [[a, b]];

  while (stack.length > 0) {
    const [currA, currB] = stack.pop();

    if (Object.is(currA, currB)) {
      continue;
    }

    const typeA = getJsonValueType(currA);
    const typeB = getJsonValueType(currB);
    if (typeA !== typeB) return false;

    if (typeA === 'array') {
      if (currA.length !== currB.length) return false;
      for (let i = 0; i < currA.length; i++) {
        if (!Object.is(currA[i], currB[i])) {
          stack.push([currA[i], currB[i]]);
        }
      }
      continue;
    }

    if (typeA === 'object') {
      const keysA = Object.keys(currA);
      const keysB = Object.keys(currB);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(currB, key)) {
          return false;
        }
        if (!Object.is(currA[key], currB[key])) {
          stack.push([currA[key], currB[key]]);
        }
      }
      continue;
    }

    return false;
  }

  return true;
}

/**
 * Formats a single primitive or complex JSON value for readable diff display.
 *
 * @param {unknown} val
 * @returns {string}
 */
export function formatValueForDisplay(val) {
  const type = getJsonValueType(val);
  if (type === 'null') return 'null';
  if (type === 'undefined') return '<undefined>';
  if (type === 'string') return `"${val}"`;
  if (type === 'number' || type === 'boolean') return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

/**
 * Traverses two JSON values and produces an array of structured DiffEntry records.
 *
 * Behavioral notes on maxDepth:
 * - maxDepth defines the maximum depth for reporting detailed, granular JSONPath diffs.
 * - Once depth >= maxDepth, traversal halts granular child path exploration. If the
 *   subtrees at the boundary are structurally unequal, a single 'modified' diff is
 *   recorded at that boundary path rather than enumerating each nested change.
 * - If subtrees at the boundary are identical, no diff is emitted.
 * - Resource usage: Fast-path checks (type mismatch, primitive inequality, array length
 *   mismatch, object key count mismatch) immediately record differences without traversing
 *   subtrees. However, when types and sizes match, an iterative stack-safe deep equality
 *   check (isDeepEqual) is executed to prevent false positives. Thus, maxDepth bounds
 *   path granularity and call stack depth, but it does NOT strictly limit total CPU work,
 *   as validating equality across large identical or near-identical subtrees still requires
 *   traversing nodes.
 *
 * Behavioral notes on maxDiffs:
 * - Limits the maximum number of recorded diff entries returned in the `diffs` array.
 * - When differences exist beyond this limit, `truncated` is set to true.
 * - A maxDiffs of 0 records 0 diffs, flagging `truncated: true` only if differences actually exist.
 *
 * @param {unknown} left - Original parsed value
 * @param {unknown} right - Modified parsed value
 * @param {object} [options]
 * @param {string} [options.basePath='$']
 * @param {number} [options.maxDiffs=5000]
 * @param {number} [options.maxDepth=50]
 * @returns {{
 *   diffs: Array<{
 *     id: string,
 *     path: string,
 *     type: 'added' | 'removed' | 'modified',
 *     oldValue?: unknown,
 *     newValue?: unknown,
 *     oldType?: string,
 *     newType?: string,
 *     isTypeChanged: boolean,
 *     displayOld: string,
 *     displayNew: string,
 *   }>,
 *   truncated: boolean,
 * }}
 */
export function computeJsonDiff(left, right, options = {}) {
  const { basePath = '$', maxDiffs = DEFAULT_MAX_DIFFS, maxDepth = DEFAULT_MAX_DEPTH } = options;
  const limit = normalizeLimit(maxDiffs, DEFAULT_MAX_DIFFS, UPPER_MAX_DIFFS);
  const safeMaxDepth = normalizeDepth(maxDepth, DEFAULT_MAX_DEPTH, UPPER_MAX_DEPTH);
  const diffs = [];
  let truncated = false;
  let counter = 0;

  function recordDifference(path, type, oldValue, newValue) {
    if (diffs.length < limit) {
      counter++;
      const oldType = getJsonValueType(oldValue);
      const newType = getJsonValueType(newValue);
      const isTypeChanged = type === 'modified' && oldType !== newType;

      diffs.push({
        id: `diff-${counter}-${path}`,
        path,
        type,
        oldValue,
        newValue,
        oldType,
        newType,
        isTypeChanged,
        displayOld: type !== 'added' ? formatValueForDisplay(oldValue) : '',
        displayNew: type !== 'removed' ? formatValueForDisplay(newValue) : '',
      });
    } else {
      // An actual additional difference exists beyond the permitted output limit
      truncated = true;
    }
  }

  function compareRecursive(l, r, path, depth) {
    if (truncated) {
      return;
    }

    if (Object.is(l, r)) {
      return;
    }

    const typeL = getJsonValueType(l);
    const typeR = getJsonValueType(r);

    if (depth >= safeMaxDepth) {
      // Exceeded depth ceiling: evaluate boundary node without deeper path expansion.
      // Fast-path inequality checks avoid redundant subtree traversal:
      if (typeL !== typeR) {
        recordDifference(path, 'modified', l, r);
        return;
      }
      if (typeL !== 'object' && typeL !== 'array') {
        recordDifference(path, 'modified', l, r);
        return;
      }
      if (typeL === 'array' && l.length !== r.length) {
        recordDifference(path, 'modified', l, r);
        return;
      }
      if (typeL === 'object' && Object.keys(l).length !== Object.keys(r).length) {
        recordDifference(path, 'modified', l, r);
        return;
      }
      // When types and lengths/key counts match, verify subtree equality to avoid false diffs.
      // Note: isDeepEqual performs iterative traversal of the remaining subtree.
      if (!isDeepEqual(l, r)) {
        recordDifference(path, 'modified', l, r);
      }
      return;
    }

    // If types differ, mark modified directly
    if (typeL !== typeR) {
      recordDifference(path, 'modified', l, r);
      return;
    }

    // Both are objects
    if (typeL === 'object') {
      const keysL = Object.keys(l);
      const keysR = Object.keys(r);
      const allKeys = Array.from(new Set([...keysL, ...keysR])).sort();

      for (const key of allKeys) {
        if (truncated) break;

        const childPath = `${path}.${key}`;
        const hasL = Object.prototype.hasOwnProperty.call(l, key);
        const hasR = Object.prototype.hasOwnProperty.call(r, key);

        if (hasL && !hasR) {
          recordDifference(childPath, 'removed', l[key], undefined);
        } else if (!hasL && hasR) {
          recordDifference(childPath, 'added', undefined, r[key]);
        } else if (!Object.is(l[key], r[key])) {
          compareRecursive(l[key], r[key], childPath, depth + 1);
        }
      }
      return;
    }

    // Both are arrays
    if (typeL === 'array') {
      const lenL = l.length;
      const lenR = r.length;
      const minLen = Math.min(lenL, lenR);

      // Compare overlapping indices
      for (let i = 0; i < minLen; i++) {
        if (truncated) break;
        const indexPath = `${path}[${i}]`;
        if (!Object.is(l[i], r[i])) {
          compareRecursive(l[i], r[i], indexPath, depth + 1);
        }
      }

      // Left had more elements: excess items in left are removed
      if (lenL > lenR) {
        for (let i = minLen; i < lenL; i++) {
          if (truncated) break;
          const indexPath = `${path}[${i}]`;
          recordDifference(indexPath, 'removed', l[i], undefined);
        }
      }

      // Right had more elements: excess items in right are added
      if (lenR > lenL) {
        for (let i = minLen; i < lenR; i++) {
          if (truncated) break;
          const indexPath = `${path}[${i}]`;
          recordDifference(indexPath, 'added', undefined, r[i]);
        }
      }
      return;
    }

    // Both are primitive values that are not deep equal
    recordDifference(path, 'modified', l, r);
  }

  compareRecursive(left, right, basePath, 0);

  return { diffs, truncated };
}

/**
 * Main JSON comparison function accepting raw string inputs.
 * Validates both inputs independently and executes structural diff.
 *
 * @param {string} originalText - Raw text for left document
 * @param {string} modifiedText - Raw text for right document
 * @param {object} [options]
 * @returns {{
 *   diffs: Array<any>,
 *   isIdentical: boolean,
 *   isEmpty: boolean,
 *   truncated: boolean,
 *   leftError: string | null,
 *   rightError: string | null,
 *   stats: { added: number, removed: number, modified: number, total: number },
 * }}
 */
export function compareJsonStrings(originalText, modifiedText, options = {}) {
  // Guard against oversized inputs that risk memory exhaustion before trimming
  if (typeof originalText === 'string' && originalText.length > MAX_JSON_DIFF_INPUT_LENGTH) {
    return {
      diffs: [],
      isIdentical: false,
      isEmpty: false,
      truncated: false,
      leftError: `Original JSON exceeds maximum supported size of 5 MB (${MAX_JSON_DIFF_INPUT_LENGTH.toLocaleString()} characters).`,
      rightError: null,
      stats: { added: 0, removed: 0, modified: 0, total: 0 },
    };
  }
  if (typeof modifiedText === 'string' && modifiedText.length > MAX_JSON_DIFF_INPUT_LENGTH) {
    return {
      diffs: [],
      isIdentical: false,
      isEmpty: false,
      truncated: false,
      leftError: null,
      rightError: `Modified JSON exceeds maximum supported size of 5 MB (${MAX_JSON_DIFF_INPUT_LENGTH.toLocaleString()} characters).`,
      stats: { added: 0, removed: 0, modified: 0, total: 0 },
    };
  }

  const leftTrim = typeof originalText === 'string' ? originalText.trim() : '';
  const rightTrim = typeof modifiedText === 'string' ? modifiedText.trim() : '';

  // Handle empty inputs cleanly without errors
  if (!leftTrim || !rightTrim) {
    return {
      diffs: [],
      isIdentical: false,
      isEmpty: true,
      truncated: false,
      leftError: null,
      rightError: null,
      stats: { added: 0, removed: 0, modified: 0, total: 0 },
    };
  }

  let leftParsed;
  let rightParsed;
  let leftError = null;
  let rightError = null;

  try {
    leftParsed = JSON.parse(originalText);
  } catch (err) {
    leftError = err instanceof Error ? err.message : 'Invalid JSON syntax in original document';
  }

  try {
    rightParsed = JSON.parse(modifiedText);
  } catch (err) {
    rightError = err instanceof Error ? err.message : 'Invalid JSON syntax in modified document';
  }

  if (leftError || rightError) {
    return {
      diffs: [],
      isIdentical: false,
      isEmpty: false,
      truncated: false,
      leftError,
      rightError,
      stats: { added: 0, removed: 0, modified: 0, total: 0 },
    };
  }

  const { diffs, truncated } = computeJsonDiff(leftParsed, rightParsed, options);

  const stats = {
    added: 0,
    removed: 0,
    modified: 0,
    total: diffs.length,
  };

  for (const d of diffs) {
    if (d.type === 'added') stats.added++;
    else if (d.type === 'removed') stats.removed++;
    else if (d.type === 'modified') stats.modified++;
  }

  return {
    diffs,
    isIdentical: diffs.length === 0 && !truncated,
    isEmpty: false,
    truncated,
    leftError: null,
    rightError: null,
    stats,
  };
}

/**
 * Formats difference records into human-readable plain text for clipboard export.
 *
 * @param {Array<any>} diffs
 * @param {{ added: number, removed: number, modified: number, total: number }} stats
 * @param {boolean} [truncated=false]
 * @returns {string}
 */
export function formatDiffAsText(diffs, stats, truncated = false) {
  if (!diffs || diffs.length === 0) {
    if (truncated) {
      return 'DevLens JSON Diff\nStatus: Comparison was capped at difference limit (0 differences displayed). Differences may remain undisplayed.\n';
    }
    return 'DevLens JSON Diff\nStatus: Documents are structurally identical (0 differences found).\n';
  }

  const lines = [
    'DevLens JSON Diff Report',
    `Total Differences: ${stats ? stats.total : diffs.length}${truncated ? ' (capped at limit)' : ''}`,
    `Summary: ${stats ? stats.added : 0} added (+), ${stats ? stats.removed : 0} removed (-), ${stats ? stats.modified : 0} modified (~)`,
    '------------------------------------------------------------',
  ];

  diffs.forEach((d, idx) => {
    const symbol = d.type === 'added' ? '(+)' : d.type === 'removed' ? '(-)' : '(~)';
    lines.push(`[#${idx + 1}] ${symbol} ${d.type.toUpperCase()}: ${d.path}`);
    if (d.type === 'removed' || d.type === 'modified') {
      lines.push(`  - Old: ${d.displayOld}`);
    }
    if (d.type === 'added' || d.type === 'modified') {
      lines.push(`  + New: ${d.displayNew}`);
    }
    if (d.isTypeChanged) {
      lines.push(`  * Type change: ${d.oldType} -> ${d.newType}`);
    }
  });

  return lines.join('\n');
}

/**
 * Formats difference records into structured JSON for export.
 *
 * @param {Array<any>} diffs
 * @param {{ added: number, removed: number, modified: number, total: number }} stats
 * @param {boolean} [truncated=false]
 * @returns {string}
 */
export function formatDiffAsJson(diffs, stats, truncated = false) {
  const safeStats = stats || {
    added: 0,
    removed: 0,
    modified: 0,
    total: diffs ? diffs.length : 0,
  };
  return JSON.stringify(
    {
      tool: 'DevLens JSON Diff',
      totalDifferences: safeStats.total,
      summary: safeStats,
      truncated,
      differences: (diffs || []).map((d) => ({
        path: d.path,
        type: d.type,
        oldValue: d.oldValue,
        newValue: d.newValue,
        oldType: d.oldType,
        newType: d.newType,
        isTypeChanged: Boolean(d.isTypeChanged),
      })),
    },
    null,
    2
  );
}
