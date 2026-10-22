/**
 * Pure Regex utility functions for DevLens Regex Playground.
 * All operations execute locally in memory using native JavaScript RegExp.
 * No eval() or third-party regex dependencies are used.
 */

export const SUPPORTED_FLAGS = [
  {
    flag: 'g',
    label: 'Global (g)',
    description: 'Match all occurrences rather than stopping after the first',
  },
  {
    flag: 'i',
    label: 'Case Insensitive (i)',
    description: 'Ignore uppercase/lowercase distinction',
  },
  {
    flag: 'm',
    label: 'Multiline (m)',
    description: '^ and $ match the beginning and end of each line',
  },
  {
    flag: 's',
    label: 'Dot All (s)',
    description: '. matches any character including newline (\\n)',
  },
  {
    flag: 'u',
    label: 'Unicode (u)',
    description: 'Treat pattern and text as a sequence of Unicode code points',
  },
];

/**
 * Built-in sample regex, flags, and test text.
 */
export const SAMPLE_REGEX = {
  pattern: '[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}',
  flags: 'gi',
  testText: 'Contact dev@example.com or support@devlens.io for help. Invalid: user@',
};

/**
 * Validates and canonicalizes regex flag characters.
 *
 * @param {string} flags
 * @returns {string} Clean, sorted, deduplicated flags containing only supported flags
 */
export function sanitizeFlags(flags) {
  if (typeof flags !== 'string') return '';
  const allowed = new Set(['g', 'i', 'm', 's', 'u']);
  const unique = [];
  for (const char of flags) {
    if (allowed.has(char) && !unique.includes(char)) {
      unique.push(char);
    }
  }
  return unique.sort().join('');
}

/**
 * Safely compiles a pattern and flags into a native RegExp instance.
 *
 * @param {string} pattern
 * @param {string} flags
 * @returns {{ regex: RegExp | null, error: string | null }}
 */
export function compileRegex(pattern, flags = '') {
  if (!pattern || typeof pattern !== 'string') {
    return { regex: null, error: null };
  }

  try {
    const validFlags = sanitizeFlags(flags);
    const regex = new RegExp(pattern, validFlags);
    return { regex, error: null };
  } catch (err) {
    return {
      regex: null,
      error: err instanceof Error ? err.message : 'Invalid regular expression syntax',
    };
  }
}

/**
 * Finds all matches of a regex in the given test text.
 * Safely guards against infinite loops caused by zero-length matches and
 * accurately detects if additional matches exist beyond maxMatches.
 *
 * @param {string} pattern
 * @param {string} flags
 * @param {string} text
 * @param {number} [maxMatches=5000] - Safety ceiling to prevent memory exhaustion on runaway matches
 * @returns {{
 *   matches: Array<{
 *     matchNumber: number,
 *     match: string,
 *     index: number,
 *     endIndex: number,
 *     groups: Array<string | undefined>,
 *     namedGroups: Record<string, string> | null,
 *   }>,
 *   error: string | null,
 *   isEmpty: boolean,
 *   truncated: boolean,
 * }}
 */
export function findMatches(pattern, flags, text, maxMatches = 5000) {
  if (typeof pattern !== 'string' || pattern.trim() === '' || typeof text !== 'string') {
    return { matches: [], error: null, isEmpty: true, truncated: false };
  }

  const { regex, error } = compileRegex(pattern, flags);
  if (error || !regex) {
    return { matches: [], error, isEmpty: false, truncated: false };
  }

  const matches = [];
  const isGlobal = regex.global;

  if (!isGlobal) {
    // Non-global regex: executes once
    const singleMatch = regex.exec(text);
    if (singleMatch) {
      matches.push({
        matchNumber: 1,
        match: singleMatch[0],
        index: singleMatch.index,
        endIndex: singleMatch.index + singleMatch[0].length,
        groups: singleMatch.slice(1),
        namedGroups: singleMatch.groups ? { ...singleMatch.groups } : null,
      });
    }
    return { matches, error: null, isEmpty: matches.length === 0, truncated: false };
  }

  // Global regex: execute iteratively with zero-length loop prevention
  let match;
  let count = 0;
  let truncated = false;
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    count++;
    matches.push({
      matchNumber: count,
      match: match[0],
      index: match.index,
      endIndex: match.index + match[0].length,
      groups: match.slice(1),
      namedGroups: match.groups ? { ...match.groups } : null,
    });

    // Zero-length match protection (e.g. ^, $, \b, a* on empty)
    if (match[0].length === 0) {
      // If regex.lastIndex has not advanced past the match index, advance by 1 code unit
      // (or 2 code units if regex.unicode is true and match is at an astral code point)
      if (regex.lastIndex === match.index) {
        let charStep = 1;
        if (regex.unicode) {
          const codePoint = text.codePointAt(match.index);
          if (codePoint !== undefined && codePoint > 0xffff) {
            charStep = 2;
          }
        }
        regex.lastIndex += charStep;
      }
      if (regex.lastIndex > text.length) {
        break;
      }
    }

    if (matches.length >= maxMatches) {
      // Accurately verify whether an additional match actually exists beyond maxMatches without an unbounded loop
      if (regex.lastIndex <= text.length) {
        const peekNext = regex.exec(text);
        if (peekNext !== null) {
          truncated = true;
        }
      }
      break;
    }
  }

  return {
    matches,
    error: null,
    isEmpty: matches.length === 0,
    truncated,
  };
}

/**
 * Splits text into safe sequential chunks for UI highlighting without dangerouslySetInnerHTML.
 * Overlapping and nested match ranges are handled deterministically:
 * - Contained/subsumed ranges are absorbed by the outer match.
 * - Partially overlapping ranges highlight the unconsumed trailing segment.
 * - Zero-length matches are rendered as visual zero-width markers without mutating text.
 * - Preserves original text, whitespace, and line breaks identically.
 *
 * @param {string} text - Original test text
 * @param {Array<{ index: number, endIndex: number, matchNumber: number }>} matches
 * @returns {Array<{ text: string, isMatch: boolean, matchNumber?: number, key: string, isZeroLength?: boolean }>}
 */
export function getHighlightSegments(text, matches) {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }

  if (!matches || matches.length === 0) {
    return [{ text, isMatch: false, key: 'segment-0' }];
  }

  const segments = [];
  let lastIndex = 0;

  // Filter out any invalid ranges and sort deterministically
  const sortedMatches = [...matches]
    .filter(
      (m) =>
        typeof m.index === 'number' &&
        typeof m.endIndex === 'number' &&
        m.index >= 0 &&
        m.endIndex >= m.index &&
        m.endIndex <= text.length
    )
    .sort((a, b) => a.index - b.index || b.endIndex - a.endIndex);

  sortedMatches.forEach((m, idx) => {
    const isZeroLength = m.index === m.endIndex;

    // Skip if non-zero match is already completely covered by a previous segment
    if (!isZeroLength && m.endIndex <= lastIndex) {
      return;
    }
    // Skip if zero-length match is strictly before lastIndex
    if (isZeroLength && m.index < lastIndex) {
      return;
    }

    // Non-matched segment before this match
    if (m.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, m.index),
        isMatch: false,
        key: `unmatched-${lastIndex}-${m.index}`,
      });
      lastIndex = m.index;
    }

    if (isZeroLength) {
      segments.push({
        text: '',
        isMatch: true,
        isZeroLength: true,
        matchNumber: m.matchNumber,
        key: `zero-match-${idx}-${m.index}`,
      });
      // Zero-length matches do not advance text lastIndex
    } else {
      const matchStart = Math.max(m.index, lastIndex);
      const matchEnd = Math.max(m.endIndex, matchStart);

      if (matchEnd > matchStart) {
        segments.push({
          text: text.slice(matchStart, matchEnd),
          isMatch: true,
          matchNumber: m.matchNumber,
          key: `match-${idx}-${matchStart}-${matchEnd}`,
        });
        lastIndex = matchEnd;
      }
    }
  });

  // Remaining trailing non-matched text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isMatch: false,
      key: `unmatched-trailing-${lastIndex}`,
    });
  }

  return segments;
}

/**
 * Formats match list into human-readable plain text for clipboard export.
 *
 * @param {Array<any>} matches
 * @param {string} pattern
 * @param {string} flags
 * @param {boolean} [truncated=false]
 * @returns {string}
 */
export function formatMatchesAsText(matches, pattern, flags, truncated = false) {
  if (!matches || matches.length === 0) return 'No matches found.';

  const lines = [
    `DevLens Regex Playground Export`,
    `Pattern: /${pattern}/${flags}`,
    `Total Matches: ${matches.length}${truncated ? ' (capped at limit)' : ''}`,
    `----------------------------------------`,
  ];

  matches.forEach((m) => {
    lines.push(
      `Match #${m.matchNumber}: "${m.match}" (Index: ${m.index}..${m.endIndex}, Length: ${m.match.length})`
    );
    if (m.groups && m.groups.length > 0) {
      m.groups.forEach((grp, idx) => {
        lines.push(`  Group ${idx + 1}: ${grp !== undefined ? `"${grp}"` : '<undefined>'}`);
      });
    }
    if (m.namedGroups && Object.keys(m.namedGroups).length > 0) {
      Object.entries(m.namedGroups).forEach(([name, val]) => {
        lines.push(`  Named Group "${name}": ${val !== undefined ? `"${val}"` : '<undefined>'}`);
      });
    }
  });

  return lines.join('\n');
}

/**
 * Formats match list into structured JSON.
 *
 * @param {Array<any>} matches
 * @param {string} pattern
 * @param {string} flags
 * @param {boolean} [truncated=false]
 * @returns {string}
 */
export function formatMatchesAsJson(matches, pattern, flags, truncated = false) {
  return JSON.stringify(
    {
      pattern: `/${pattern}/${flags}`,
      totalMatches: matches.length,
      truncated: Boolean(truncated),
      matches: matches.map((m) => ({
        matchNumber: m.matchNumber,
        value: m.match,
        startIndex: m.index,
        endIndex: m.endIndex,
        length: m.match.length,
        captureGroups: m.groups || [],
        namedGroups: m.namedGroups || {},
      })),
    },
    null,
    2
  );
}
