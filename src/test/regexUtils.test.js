import { describe, it, expect } from 'vitest';
import {
  sanitizeFlags,
  compileRegex,
  findMatches,
  getHighlightSegments,
  formatMatchesAsText,
  formatMatchesAsJson,
  SAMPLE_REGEX,
} from '../lib/regexUtils';

describe('regexUtils Unit Tests', () => {
  describe('sanitizeFlags', () => {
    it('filters out unsupported characters, includes u flag, and deduplicates flags', () => {
      expect(sanitizeFlags('gimsuvxyz123')).toBe('gimsu');
      expect(sanitizeFlags('gggiii')).toBe('gi');
      expect(sanitizeFlags('sigm')).toBe('gims');
    });

    it('returns empty string for non-string or empty inputs', () => {
      expect(sanitizeFlags('')).toBe('');
      expect(sanitizeFlags(null)).toBe('');
      expect(sanitizeFlags(undefined)).toBe('');
    });
  });

  describe('compileRegex', () => {
    it('compiles a valid pattern with sanitized flags', () => {
      const { regex, error } = compileRegex('[a-z]+', 'gi');
      expect(error).toBeNull();
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.flags).toBe('gi');
    });

    it('returns null regex and null error when pattern is empty', () => {
      const { regex, error } = compileRegex('');
      expect(regex).toBeNull();
      expect(error).toBeNull();
    });

    it('catches and returns descriptive error for invalid regex syntax', () => {
      const { regex, error } = compileRegex('[unclosed-bracket');
      expect(regex).toBeNull();
      expect(error).not.toBeNull();
      expect(typeof error).toBe('string');
    });
  });

  describe('findMatches', () => {
    it('returns empty matches when pattern or text is empty', () => {
      expect(findMatches('', 'g', 'sample text').isEmpty).toBe(true);
      expect(findMatches('[a-z]', 'g', '').isEmpty).toBe(true);
      expect(findMatches('   ', 'g', 'sample text').isEmpty).toBe(true);
    });

    it('returns syntax error for invalid pattern without throwing', () => {
      const result = findMatches('(unclosed-group', 'g', 'test');
      expect(result.error).not.toBeNull();
      expect(result.matches).toEqual([]);
    });

    it('matches with global flag (g) finding all occurrences', () => {
      const text = 'cat bat mat rat';
      const result = findMatches('[a-z]at', 'g', text);

      expect(result.error).toBeNull();
      expect(result.matches).toHaveLength(4);
      expect(result.matches.map((m) => m.match)).toEqual(['cat', 'bat', 'mat', 'rat']);
      expect(result.matches[0].index).toBe(0);
      expect(result.matches[0].endIndex).toBe(3);
    });

    it('matches without global flag finding only the first occurrence', () => {
      const text = 'cat bat mat';
      const result = findMatches('[a-z]at', '', text);

      expect(result.error).toBeNull();
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('cat');
      expect(result.matches[0].index).toBe(0);
    });

    it('handles case-sensitive and case-insensitive (i) flag', () => {
      const text = 'Hello HELLO hello';

      const caseSensitive = findMatches('hello', 'g', text);
      expect(caseSensitive.matches).toHaveLength(1);

      const caseInsensitive = findMatches('hello', 'gi', text);
      expect(caseInsensitive.matches).toHaveLength(3);
    });

    it('handles multiline (m) flag for line start and end anchors', () => {
      const text = 'first\nsecond\nthird';

      const withoutM = findMatches('^\\w+', 'g', text);
      expect(withoutM.matches).toHaveLength(1);
      expect(withoutM.matches[0].match).toBe('first');

      const withM = findMatches('^\\w+', 'gm', text);
      expect(withM.matches).toHaveLength(3);
      expect(withM.matches.map((m) => m.match)).toEqual(['first', 'second', 'third']);
    });

    it('handles dotAll (s) flag matching newline characters with dot', () => {
      const text = 'start\nmiddle\nend';

      const withoutS = findMatches('start.*end', 'g', text);
      expect(withoutS.matches).toHaveLength(0);

      const withS = findMatches('start.*end', 'gs', text);
      expect(withS.matches).toHaveLength(1);
      expect(withS.matches[0].match).toBe('start\nmiddle\nend');
    });

    it('extracts capturing groups and named capturing groups', () => {
      const text = '2026-10-18';
      const pattern = '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})';
      const result = findMatches(pattern, 'g', text);

      expect(result.matches).toHaveLength(1);
      const m = result.matches[0];
      expect(m.groups).toEqual(['2026', '10', '18']);
      expect(m.namedGroups).toEqual({
        year: '2026',
        month: '10',
        day: '18',
      });
    });

    it('safely handles zero-length matches without hanging in an infinite loop', () => {
      const text = 'a b';
      const result = findMatches('\\b', 'g', text);

      expect(result.error).toBeNull();
      expect(result.matches.length).toBeGreaterThan(0);
      result.matches.forEach((m) => {
        expect(m.match).toBe('');
        expect(m.index).toBe(m.endIndex);
      });
    });

    it('safely handles zero-length match at the very end of the string', () => {
      const text = 'hello';
      const result = findMatches('$', 'g', text);

      expect(result.error).toBeNull();
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].index).toBe(5);
      expect(result.matches[0].endIndex).toBe(5);
      expect(result.matches[0].match).toBe('');
      expect(result.truncated).toBe(false);
    });

    it('safely handles empty match repetitions (e.g. a*) without infinite loop', () => {
      const text = 'baac';
      const result = findMatches('a*', 'g', text);

      expect(result.error).toBeNull();
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('processes SAMPLE_REGEX email pattern correctly', () => {
      const result = findMatches(SAMPLE_REGEX.pattern, SAMPLE_REGEX.flags, SAMPLE_REGEX.testText);
      expect(result.error).toBeNull();
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0].match).toBe('dev@example.com');
      expect(result.matches[1].match).toBe('support@devlens.io');
    });

    it('handles unicode characters, surrogate pairs, and u flag safely', () => {
      const text = 'User 👩‍💻 coded 🚀 in DevLens';
      const result = findMatches('🚀', 'gu', text);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('🚀');
    });

    it('advances zero-length matches across astral characters by code units when u is absent', () => {
      // '😀' is 2 UTF-16 code units (\uD83D\uDE00).
      // Without 'u', RegExp operates on UTF-16 code units, matching at indices 0, 1, and 2.
      const text = '😀';
      const result = findMatches('(?:)', 'g', text);
      expect(result.error).toBeNull();
      expect(result.matches.map((m) => m.index)).toEqual([0, 1, 2]);

      // Regression test explicitly specified for 🚀 with lookahead (?=)
      const rocketG = findMatches('(?=)', 'g', '🚀');
      expect(rocketG.error).toBeNull();
      expect(rocketG.matches.map((m) => m.index)).toEqual([0, 1, 2]);
    });

    it('advances zero-length matches across surrogate pairs by code points when u flag is present', () => {
      // With 'u', RegExp operates on Unicode code points, stepping past the 2-unit surrogate pair.
      const text = '😀';
      const result = findMatches('(?:)', 'gu', text);
      expect(result.error).toBeNull();
      expect(result.matches.map((m) => m.index)).toEqual([0, 2]);

      // Regression test explicitly specified for 🚀 with lookahead (?=)
      const rocketGu = findMatches('(?=)', 'gu', '🚀');
      expect(rocketGu.error).toBeNull();
      expect(rocketGu.matches.map((m) => m.index)).toEqual([0, 2]);
    });

    it('tests (?=) lookahead with g and gu across multiple consecutive astral characters and end of input', () => {
      // Multiple consecutive astral characters: '🚀🛸' and '🚀🛸🌟'
      const multiAstral = '🚀🛸';
      // '🚀🛸' consists of two surrogate pairs (4 UTF-16 code units).
      // Without 'u': matches at every code unit boundary [0, 1, 2, 3, 4].
      const resG = findMatches('(?=)', 'g', multiAstral);
      expect(resG.error).toBeNull();
      expect(resG.matches.map((m) => m.index)).toEqual([0, 1, 2, 3, 4]);

      // With 'gu': matches at code point boundaries [0, 2, 4].
      const resGu = findMatches('(?=)', 'gu', multiAstral);
      expect(resGu.error).toBeNull();
      expect(resGu.matches.map((m) => m.index)).toEqual([0, 2, 4]);

      // Three consecutive astral characters (6 UTF-16 code units)
      const threeAstral = '🚀🛸🌟';
      const threeG = findMatches('(?=)', 'g', threeAstral);
      expect(threeG.matches.map((m) => m.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);

      const threeGu = findMatches('(?=)', 'gu', threeAstral);
      expect(threeGu.matches.map((m) => m.index)).toEqual([0, 2, 4, 6]);

      // Mixed ASCII and astral characters: 'a🚀b🛸' (lengths: 1 + 2 + 1 + 2 = 6 code units)
      const mixed = 'a🚀b🛸';
      const mixedG = findMatches('(?=)', 'g', mixed);
      expect(mixedG.matches.map((m) => m.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);

      const mixedGu = findMatches('(?=)', 'gu', mixed);
      expect(mixedGu.matches.map((m) => m.index)).toEqual([0, 1, 3, 4, 6]);

      // End-of-input behavior with anchors ($) and empty strings
      const rocketEndG = findMatches('$', 'g', '🚀');
      expect(rocketEndG.matches).toHaveLength(1);
      expect(rocketEndG.matches[0].index).toBe(2);

      const rocketEndGu = findMatches('$', 'gu', '🚀');
      expect(rocketEndGu.matches).toHaveLength(1);
      expect(rocketEndGu.matches[0].index).toBe(2);

      const endAstralG = findMatches('$', 'g', 'hello🚀');
      expect(endAstralG.matches).toHaveLength(1);
      expect(endAstralG.matches[0].index).toBe(7);

      const endAstralGu = findMatches('$', 'gu', 'hello🚀');
      expect(endAstralGu.matches).toHaveLength(1);
      expect(endAstralGu.matches[0].index).toBe(7);

      const emptyG = findMatches('(?=)', 'g', '');
      expect(emptyG.matches.map((m) => m.index)).toEqual([0]);

      const emptyGu = findMatches('(?=)', 'gu', '');
      expect(emptyGu.matches.map((m) => m.index)).toEqual([0]);
    });

    it('does NOT mark truncated when matches are fewer than maxMatches', () => {
      const text = 'a'.repeat(50);
      const result = findMatches('a', 'g', text, 100);
      expect(result.matches).toHaveLength(50);
      expect(result.truncated).toBe(false);
    });

    it('does NOT mark truncated when matches equal exactly maxMatches with no additional match', () => {
      const text = 'a'.repeat(100);
      const result = findMatches('a', 'g', text, 100);
      expect(result.matches).toHaveLength(100);
      expect(result.truncated).toBe(false);
    });

    it('correctly marks truncated when matches exceed maxMatches and caps match array', () => {
      const text = 'a'.repeat(101);
      const result = findMatches('a', 'g', text, 100);
      expect(result.matches).toHaveLength(100);
      expect(result.truncated).toBe(true);
    });

    it('correctly marks truncated for zero-length matches when exceeding maxMatches', () => {
      const text = 'abcdef';
      // '(?=)' matches at indices 0, 1, 2, 3, 4, 5, 6 (7 matches total)
      const result = findMatches('(?=)', 'g', text, 3);
      expect(result.matches).toHaveLength(3);
      expect(result.truncated).toBe(true);
    });

    it('produces consistent results on repeated calls with the same input', () => {
      const text = 'test repeat call consistency';
      const run1 = findMatches('\\w+', 'g', text);
      const run2 = findMatches('\\w+', 'g', text);
      expect(run1).toEqual(run2);
    });
  });

  describe('getHighlightSegments', () => {
    it('returns single unmatched segment when matches array is empty', () => {
      const text = 'plain text without matches';
      const segments = getHighlightSegments(text, []);
      expect(segments).toEqual([
        { text: 'plain text without matches', isMatch: false, key: 'segment-0' },
      ]);
    });

    it('splits text into matched and unmatched chunks preserving original characters exactly', () => {
      const text = 'hello world foo bar';
      const matches = [
        { index: 6, endIndex: 11, matchNumber: 1 },
        { index: 16, endIndex: 19, matchNumber: 2 },
      ];

      const segments = getHighlightSegments(text, matches);
      const reconstructed = segments.map((s) => s.text).join('');
      expect(reconstructed).toBe(text);

      expect(segments).toHaveLength(4);
      expect(segments[0]).toEqual({ text: 'hello ', isMatch: false, key: 'unmatched-0-6' });
      expect(segments[1]).toEqual({
        text: 'world',
        isMatch: true,
        matchNumber: 1,
        key: 'match-0-6-11',
      });
      expect(segments[2]).toEqual({ text: ' foo ', isMatch: false, key: 'unmatched-11-16' });
      expect(segments[3]).toEqual({
        text: 'bar',
        isMatch: true,
        matchNumber: 2,
        key: 'match-1-16-19',
      });
    });

    it('handles matches at the very start and very end of the string', () => {
      const text = 'start-middle-end';
      const matches = [
        { index: 0, endIndex: 5, matchNumber: 1 },
        { index: 13, endIndex: 16, matchNumber: 2 },
      ];

      const segments = getHighlightSegments(text, matches);
      expect(segments.map((s) => s.text).join('')).toBe(text);
      expect(segments[0].isMatch).toBe(true);
      expect(segments[0].text).toBe('start');
      expect(segments[1].isMatch).toBe(false);
      expect(segments[1].text).toBe('-middle-');
      expect(segments[2].isMatch).toBe(true);
      expect(segments[2].text).toBe('end');
    });

    it('handles adjacent matches without gaps', () => {
      const text = 'aabb';
      const matches = [
        { index: 0, endIndex: 2, matchNumber: 1 },
        { index: 2, endIndex: 4, matchNumber: 2 },
      ];

      const segments = getHighlightSegments(text, matches);
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe('aa');
      expect(segments[0].isMatch).toBe(true);
      expect(segments[1].text).toBe('bb');
      expect(segments[1].isMatch).toBe(true);
    });

    it('safely absorbs subsumed or contained matches without duplicating text', () => {
      const text = 'abcdefgh';
      const matches = [
        { index: 1, endIndex: 6, matchNumber: 1 }, // 'bcdef'
        { index: 2, endIndex: 4, matchNumber: 2 }, // subsumed 'cd'
      ];

      const segments = getHighlightSegments(text, matches);
      expect(segments.map((s) => s.text).join('')).toBe(text);
      expect(segments).toHaveLength(3);
      expect(segments[0].text).toBe('a');
      expect(segments[1].text).toBe('bcdef');
      expect(segments[2].text).toBe('gh');
    });

    it('safely handles duplicate identical matches without duplicating text', () => {
      const text = 'abcdef';
      const matches = [
        { index: 2, endIndex: 4, matchNumber: 1 },
        { index: 2, endIndex: 4, matchNumber: 2 },
      ];

      const segments = getHighlightSegments(text, matches);
      expect(segments.map((s) => s.text).join('')).toBe(text);
      expect(segments).toHaveLength(3);
      expect(segments[0].text).toBe('ab');
      expect(segments[1].text).toBe('cd');
      expect(segments[2].text).toBe('ef');
    });

    it('handles partially overlapping matches without duplicating or dropping characters', () => {
      const text = 'testart';
      const matches = [
        { index: 0, endIndex: 4, matchNumber: 1 }, // 'test'
        { index: 2, endIndex: 6, matchNumber: 2 }, // 'star' (overlaps)
      ];

      const segments = getHighlightSegments(text, matches);
      expect(segments.map((s) => s.text).join('')).toBe(text);
      expect(segments[0].text).toBe('test');
      expect(segments[0].isMatch).toBe(true);
      expect(segments[1].text).toBe('ar');
      expect(segments[1].isMatch).toBe(true);
      expect(segments[2].text).toBe('t');
      expect(segments[2].isMatch).toBe(false);
    });

    it('handles zero-length matches at beginning, middle, and end without corrupting text', () => {
      const text = 'abc';
      const matches = [
        { index: 0, endIndex: 0, matchNumber: 1 },
        { index: 2, endIndex: 2, matchNumber: 2 },
        { index: 3, endIndex: 3, matchNumber: 3 },
      ];

      const segments = getHighlightSegments(text, matches);
      expect(segments.map((s) => s.text).join('')).toBe(text);
    });

    it('clamps out-of-range match indices safely to source string boundaries', () => {
      const text = 'hello';
      const matches = [{ index: -5, endIndex: 99, matchNumber: 1 }];

      const segments = getHighlightSegments(text, matches);
      expect(segments.map((s) => s.text).join('')).toBe(text);
    });

    it('preserves multi-line whitespace and line breaks', () => {
      const text = 'line 1\n  line 2\n\tline 3';
      const matches = [{ index: 7, endIndex: 15, matchNumber: 1 }];

      const segments = getHighlightSegments(text, matches);
      expect(segments.map((s) => s.text).join('')).toBe(text);
    });
  });

  describe('formatMatchesAsText and formatMatchesAsJson', () => {
    const sampleMatches = [
      {
        matchNumber: 1,
        match: 'test@example.com',
        index: 0,
        endIndex: 16,
        groups: ['test', 'example.com'],
        namedGroups: { user: 'test' },
      },
    ];

    it('formats matches into plain text export format', () => {
      const formatted = formatMatchesAsText(sampleMatches, '[A-Z]+', 'gi');
      expect(formatted).toContain('DevLens Regex Playground Export');
      expect(formatted).toContain('Match #1: "test@example.com"');
      expect(formatted).toContain('Group 1: "test"');
      expect(formatted).toContain('Named Group "user": "test"');
      expect(formatted).not.toContain('(capped at limit)');
    });

    it('appends truncated label when truncated flag is true in text export', () => {
      const formatted = formatMatchesAsText(sampleMatches, '[A-Z]+', 'gi', true);
      expect(formatted).toContain('(capped at limit)');
    });

    it('formats matches into structured JSON with truncated: false when not truncated', () => {
      const jsonStr = formatMatchesAsJson(sampleMatches, '[A-Z]+', 'gi', false);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.totalMatches).toBe(1);
      expect(parsed.truncated).toBe(false);
      expect(parsed.pattern).toBe('/[A-Z]+/gi');
      expect(parsed.matches[0].value).toBe('test@example.com');
      expect(parsed.matches[0].startIndex).toBe(0);
      expect(parsed.matches[0].endIndex).toBe(16);
    });

    it('includes truncated: true in JSON export when truncated flag is true', () => {
      const jsonStr = formatMatchesAsJson(sampleMatches, '[A-Z]+', 'gi', true);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.truncated).toBe(true);
    });
  });
});
