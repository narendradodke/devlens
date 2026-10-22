import { describe, it, expect } from 'vitest';
import {
  getJsonValueType,
  isDeepEqual,
  formatValueForDisplay,
  computeJsonDiff,
  compareJsonStrings,
  formatDiffAsText,
  formatDiffAsJson,
  normalizeLimit,
  normalizeDepth,
  DEFAULT_MAX_DIFFS,
  DEFAULT_MAX_DEPTH,
  UPPER_MAX_DIFFS,
  UPPER_MAX_DEPTH,
  SAMPLE_ORIGINAL_JSON,
  SAMPLE_MODIFIED_JSON,
} from '../lib/jsonDiffUtils';

describe('jsonDiffUtils Unit Tests', () => {
  describe('getJsonValueType', () => {
    it('accurately identifies all JSON data types', () => {
      expect(getJsonValueType(null)).toBe('null');
      expect(getJsonValueType(undefined)).toBe('undefined');
      expect(getJsonValueType([1, 2])).toBe('array');
      expect(getJsonValueType({})).toBe('object');
      expect(getJsonValueType('hello')).toBe('string');
      expect(getJsonValueType(42)).toBe('number');
      expect(getJsonValueType(true)).toBe('boolean');
      expect(getJsonValueType(false)).toBe('boolean');
    });
  });

  describe('formatValueForDisplay', () => {
    it('formats primitives and complex values accurately', () => {
      expect(formatValueForDisplay(null)).toBe('null');
      expect(formatValueForDisplay(undefined)).toBe('<undefined>');
      expect(formatValueForDisplay('text')).toBe('"text"');
      expect(formatValueForDisplay(123)).toBe('123');
      expect(formatValueForDisplay(true)).toBe('true');
      expect(formatValueForDisplay([1, 2])).toBe('[1,2]');
      expect(formatValueForDisplay({ a: 1 })).toBe('{"a":1}');
    });
  });

  describe('computeJsonDiff', () => {
    it('caps reported diffs and sets truncated: true when exceeding maxDiffs', () => {
      const left = { a: 1, b: 2, c: 3 };
      const right = { a: 10, b: 20, c: 30 };
      const result = computeJsonDiff(left, right, { maxDiffs: 2 });
      expect(result.diffs).toHaveLength(2);
      expect(result.truncated).toBe(true);
    });
  });

  describe('isDeepEqual', () => {
    it('returns true for identical primitives and null', () => {
      expect(isDeepEqual(42, 42)).toBe(true);
      expect(isDeepEqual('abc', 'abc')).toBe(true);
      expect(isDeepEqual(true, true)).toBe(true);
      expect(isDeepEqual(null, null)).toBe(true);
      expect(isDeepEqual(0, false)).toBe(false);
      expect(isDeepEqual('', null)).toBe(false);
    });

    it('returns true for objects with different key ordering', () => {
      const obj1 = { a: 1, b: 2, c: { x: 'test', y: true } };
      const obj2 = { b: 2, c: { y: true, x: 'test' }, a: 1 };
      expect(isDeepEqual(obj1, obj2)).toBe(true);
    });

    it('returns false for objects with differing values or keys', () => {
      expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(isDeepEqual({ a: 1 }, { b: 1 })).toBe(false);
      expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('returns true for identical arrays and false for differing arrays', () => {
      expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isDeepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
      expect(isDeepEqual([1, 2], [1, 2, 3])).toBe(false);
    });
  });

  describe('compareJsonStrings — Equivalence & Whitespace Normalization', () => {
    it('reports identical documents (0 diffs) for same JSON with different whitespace and line breaks', () => {
      const left = '{\n  "name": "DevLens",\n  "active": true\n}';
      const right = '{"active":true,"name":"DevLens"}';
      const result = compareJsonStrings(left, right);

      expect(result.isIdentical).toBe(true);
      expect(result.diffs).toHaveLength(0);
      expect(result.stats.total).toBe(0);
      expect(result.leftError).toBeNull();
      expect(result.rightError).toBeNull();
    });

    it('reports identical documents for complex nested structures with scrambled key orders', () => {
      const left = JSON.stringify({
        database: { host: 'localhost', port: 5432, ssl: false },
        services: ['auth', 'api'],
      });
      const right = JSON.stringify({
        services: ['auth', 'api'],
        database: { ssl: false, port: 5432, host: 'localhost' },
      });
      const result = compareJsonStrings(left, right);
      expect(result.isIdentical).toBe(true);
      expect(result.diffs).toHaveLength(0);
    });
  });

  describe('compareJsonStrings — Object Property Diffs', () => {
    it('detects added object properties', () => {
      const left = JSON.stringify({ a: 1 });
      const right = JSON.stringify({ a: 1, b: 'new' });
      const result = compareJsonStrings(left, right);

      expect(result.isIdentical).toBe(false);
      expect(result.stats.added).toBe(1);
      expect(result.stats.removed).toBe(0);
      expect(result.stats.modified).toBe(0);

      const diff = result.diffs[0];
      expect(diff.type).toBe('added');
      expect(diff.path).toBe('$.b');
      expect(diff.newValue).toBe('new');
    });

    it('detects removed object properties', () => {
      const left = JSON.stringify({ a: 1, b: 'old' });
      const right = JSON.stringify({ a: 1 });
      const result = compareJsonStrings(left, right);

      expect(result.stats.removed).toBe(1);
      expect(result.stats.added).toBe(0);
      const diff = result.diffs[0];
      expect(diff.type).toBe('removed');
      expect(diff.path).toBe('$.b');
      expect(diff.oldValue).toBe('old');
    });

    it('detects changed primitive values within objects', () => {
      const left = JSON.stringify({ count: 10, status: 'pending' });
      const right = JSON.stringify({ count: 20, status: 'active' });
      const result = compareJsonStrings(left, right);

      expect(result.stats.modified).toBe(2);
      expect(result.diffs.map((d) => d.path)).toEqual(['$.count', '$.status']);
      expect(result.diffs[0].oldValue).toBe(10);
      expect(result.diffs[0].newValue).toBe(20);
      expect(result.diffs[1].oldValue).toBe('pending');
      expect(result.diffs[1].newValue).toBe('active');
    });

    it('detects type mutations on properties (e.g. number to string or object to null)', () => {
      const left = JSON.stringify({ val: 42, extra: { note: 'test' } });
      const right = JSON.stringify({ val: '42', extra: null });
      const result = compareJsonStrings(left, right);

      expect(result.stats.modified).toBe(2);
      const valDiff = result.diffs.find((d) => d.path === '$.val');
      const extraDiff = result.diffs.find((d) => d.path === '$.extra');

      expect(valDiff).toBeDefined();
      expect(valDiff.isTypeChanged).toBe(true);
      expect(valDiff.oldType).toBe('number');
      expect(valDiff.newType).toBe('string');

      expect(extraDiff).toBeDefined();
      expect(extraDiff.isTypeChanged).toBe(true);
      expect(extraDiff.oldType).toBe('object');
      expect(extraDiff.newType).toBe('null');
    });

    it('traverses deep nested objects with accurate JSONPath dot notation', () => {
      const left = JSON.stringify({
        app: {
          config: {
            auth: {
              enabled: true,
              timeout: 300,
            },
          },
        },
      });
      const right = JSON.stringify({
        app: {
          config: {
            auth: {
              enabled: false,
              timeout: 600,
            },
          },
        },
      });
      const result = compareJsonStrings(left, right);
      expect(result.stats.modified).toBe(2);
      expect(result.diffs[0].path).toBe('$.app.config.auth.enabled');
      expect(result.diffs[1].path).toBe('$.app.config.auth.timeout');
    });
  });

  describe('compareJsonStrings — Array Diffs', () => {
    it('detects appended elements to arrays with correct bracket indices', () => {
      const left = JSON.stringify(['alpha', 'beta']);
      const right = JSON.stringify(['alpha', 'beta', 'gamma']);
      const result = compareJsonStrings(left, right);

      expect(result.stats.added).toBe(1);
      expect(result.diffs[0].type).toBe('added');
      expect(result.diffs[0].path).toBe('$[2]');
      expect(result.diffs[0].newValue).toBe('gamma');
    });

    it('detects removed elements from arrays when right array is shorter', () => {
      const left = JSON.stringify([10, 20, 30, 40]);
      const right = JSON.stringify([10, 20]);
      const result = compareJsonStrings(left, right);

      expect(result.stats.removed).toBe(2);
      expect(result.diffs[0].path).toBe('$[2]');
      expect(result.diffs[0].oldValue).toBe(30);
      expect(result.diffs[1].path).toBe('$[3]');
      expect(result.diffs[1].oldValue).toBe(40);
    });

    it('detects modified elements within arrays and inside array objects', () => {
      const left = JSON.stringify([{ id: 1, active: false }]);
      const right = JSON.stringify([{ id: 1, active: true }]);
      const result = compareJsonStrings(left, right);

      expect(result.stats.modified).toBe(1);
      expect(result.diffs[0].path).toBe('$[0].active');
      expect(result.diffs[0].oldValue).toBe(false);
      expect(result.diffs[0].newValue).toBe(true);
    });

    it('accurately identifies reordered array elements as index mutations', () => {
      const left = JSON.stringify(['a', 'b', 'c']);
      const right = JSON.stringify(['c', 'b', 'a']);
      const result = compareJsonStrings(left, right);

      expect(result.stats.modified).toBe(2); // $[0] and $[2] differed, $[1] remained 'b'
      expect(result.diffs[0].path).toBe('$[0]');
      expect(result.diffs[0].oldValue).toBe('a');
      expect(result.diffs[0].newValue).toBe('c');
      expect(result.diffs[1].path).toBe('$[2]');
    });
  });

  describe('compareJsonStrings — Primitives, Null, Booleans, Empty Structures', () => {
    it('handles root primitive comparisons cleanly', () => {
      const strDiff = compareJsonStrings('"foo"', '"bar"');
      expect(strDiff.stats.modified).toBe(1);
      expect(strDiff.diffs[0].path).toBe('$');

      const numDiff = compareJsonStrings('100', '200');
      expect(numDiff.stats.modified).toBe(1);

      const boolDiff = compareJsonStrings('true', 'false');
      expect(boolDiff.stats.modified).toBe(1);

      const nullDiff = compareJsonStrings('null', '"non-null"');
      expect(nullDiff.stats.modified).toBe(1);
    });

    it('correctly compares empty objects and arrays', () => {
      const emptyToNonEmpty = compareJsonStrings('{}', '{"a": 1}');
      expect(emptyToNonEmpty.stats.added).toBe(1);

      const emptyArrayToNonEmpty = compareJsonStrings('[]', '[1, 2]');
      expect(emptyArrayToNonEmpty.stats.added).toBe(2);

      const bothEmpty = compareJsonStrings('{}', '{}');
      expect(bothEmpty.isIdentical).toBe(true);

      const bothEmptyArrays = compareJsonStrings('[]', '[]');
      expect(bothEmptyArrays.isIdentical).toBe(true);
    });
  });

  describe('compareJsonStrings — Invalid JSON & Empty Input Handling', () => {
    it('returns isEmpty: true and no diffs when either or both inputs are empty', () => {
      expect(compareJsonStrings('', '').isEmpty).toBe(true);
      expect(compareJsonStrings('{"a": 1}', '').isEmpty).toBe(true);
      expect(compareJsonStrings('', '{"a": 1}').isEmpty).toBe(true);
      expect(compareJsonStrings('   ', '   ').isEmpty).toBe(true);
    });

    it('captures left syntax error independently without throwing', () => {
      const result = compareJsonStrings('{ badJson }', '{"a": 1}');
      expect(result.leftError).not.toBeNull();
      expect(result.rightError).toBeNull();
      expect(result.diffs).toHaveLength(0);
    });

    it('captures right syntax error independently without throwing', () => {
      const result = compareJsonStrings('{"a": 1}', '{ unclosed');
      expect(result.leftError).toBeNull();
      expect(result.rightError).not.toBeNull();
      expect(result.diffs).toHaveLength(0);
    });
  });

  describe('SAMPLE_ORIGINAL_JSON and SAMPLE_MODIFIED_JSON', () => {
    it('produces expected differences for the built-in sample pair', () => {
      const result = compareJsonStrings(SAMPLE_ORIGINAL_JSON, SAMPLE_MODIFIED_JSON);
      expect(result.isIdentical).toBe(false);
      expect(result.leftError).toBeNull();
      expect(result.rightError).toBeNull();
      expect(result.stats.total).toBeGreaterThan(5);
      expect(result.stats.added).toBeGreaterThan(0);
      expect(result.stats.removed).toBeGreaterThan(0);
      expect(result.stats.modified).toBeGreaterThan(0);
    });
  });

  describe('formatDiffAsText and formatDiffAsJson', () => {
    const mockDiffs = [
      {
        id: '1',
        path: '$.version',
        type: 'modified',
        oldValue: '1.0.0',
        newValue: '1.1.0',
        oldType: 'string',
        newType: 'string',
        isTypeChanged: false,
        displayOld: '"1.0.0"',
        displayNew: '"1.1.0"',
      },
      {
        id: '2',
        path: '$.features',
        type: 'added',
        newValue: ['json-diff'],
        newType: 'array',
        isTypeChanged: false,
        displayOld: '',
        displayNew: '["json-diff"]',
      },
    ];
    const mockStats = { added: 1, removed: 0, modified: 1, total: 2 };

    it('formats diffs into human-readable plain text', () => {
      const text = formatDiffAsText(mockDiffs, mockStats);
      expect(text).toContain('DevLens JSON Diff Report');
      expect(text).toContain('Total Differences: 2');
      expect(text).toContain('MODIFIED: $.version');
      expect(text).toContain('ADDED: $.features');
    });

    it('formats diffs into structured JSON export', () => {
      const jsonStr = formatDiffAsJson(mockDiffs, mockStats);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.totalDifferences).toBe(2);
      expect(parsed.summary.added).toBe(1);
      expect(parsed.differences).toHaveLength(2);
      expect(parsed.differences[0].path).toBe('$.version');
    });

    it('returns identical document notification in text export when diffs array is empty', () => {
      const text = formatDiffAsText([], { added: 0, removed: 0, modified: 0, total: 0 });
      expect(text).toContain('structurally identical');
    });
  });

  describe('Deep Nesting and Call Stack Safety', () => {
    function buildNestedObject(depth, leaf) {
      let curr = leaf;
      for (let i = 0; i < depth; i++) {
        curr = { nest: curr };
      }
      return curr;
    }

    function buildNestedArray(depth, leaf) {
      let curr = leaf;
      for (let i = 0; i < depth; i++) {
        curr = [curr];
      }
      return curr;
    }

    it('safely compares deeply nested, structurally identical objects without stack overflow', () => {
      // 12,000 nested levels would exceed standard V8 call stack size in recursive implementations
      const o1 = buildNestedObject(12000, { id: 42, label: 'deep' });
      const o2 = buildNestedObject(12000, { id: 42, label: 'deep' });

      expect(isDeepEqual(o1, o2)).toBe(true);

      const diffResult = computeJsonDiff(o1, o2);
      expect(diffResult.diffs).toHaveLength(0);
      expect(diffResult.truncated).toBe(false);
    });

    it('safely compares deeply nested objects with a difference near the root without stack overflow', () => {
      const o1 = { rootProp: 'initial', child: buildNestedObject(12000, { val: 1 }) };
      const o2 = { rootProp: 'changed', child: buildNestedObject(12000, { val: 1 }) };

      expect(isDeepEqual(o1, o2)).toBe(false);

      const diffResult = computeJsonDiff(o1, o2);
      expect(diffResult.diffs).toHaveLength(1);
      expect(diffResult.diffs[0].path).toBe('$.rootProp');
      expect(diffResult.diffs[0].oldValue).toBe('initial');
      expect(diffResult.diffs[0].newValue).toBe('changed');
    });

    it('safely handles deeply nested objects with a difference beyond maxDepth', () => {
      // Difference is located at depth 30, but maxDepth is configured to 10
      const o1 = buildNestedObject(30, { secret: 'alpha' });
      const o2 = buildNestedObject(30, { secret: 'beta' });

      expect(isDeepEqual(o1, o2)).toBe(false);

      const diffResult = computeJsonDiff(o1, o2, { maxDepth: 10 });
      // Halts recursion at maxDepth and reports modified branch
      expect(diffResult.diffs).toHaveLength(1);
      expect(diffResult.diffs[0].type).toBe('modified');
      expect(diffResult.diffs[0].path).toBe('$.nest.nest.nest.nest.nest.nest.nest.nest.nest.nest');

      // Conversely, if identical beyond maxDepth, no false differences are reported
      const identicalDeep1 = buildNestedObject(30, { secret: 'same' });
      const identicalDeep2 = buildNestedObject(30, { secret: 'same' });
      const identicalResult = computeJsonDiff(identicalDeep1, identicalDeep2, { maxDepth: 10 });
      expect(identicalResult.diffs).toHaveLength(0);
    });

    it('safely compares deeply nested arrays without stack overflow', () => {
      const a1 = buildNestedArray(12000, 'deep-item');
      const a2 = buildNestedArray(12000, 'deep-item');

      expect(isDeepEqual(a1, a2)).toBe(true);
      expect(computeJsonDiff(a1, a2).diffs).toHaveLength(0);

      const aDiff = buildNestedArray(12000, 'different-item');
      expect(isDeepEqual(a1, aDiff)).toBe(false);
    });

    it('preserves existing equality behavior for reordered object keys vs arrays', () => {
      const objA = { x: 1, y: 2, z: { m: 10, n: 20 } };
      const objB = { z: { n: 20, m: 10 }, y: 2, x: 1 };
      expect(isDeepEqual(objA, objB)).toBe(true);

      const arrA = [1, 2, 3];
      const arrB = [3, 2, 1];
      expect(isDeepEqual(arrA, arrB)).toBe(false);
    });

    it('preserves correct maxDiffs and truncated behavior across multiple changes', () => {
      const left = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      const right = { a: 10, b: 20, c: 30, d: 40, e: 50 };

      const cappedResult = computeJsonDiff(left, right, { maxDiffs: 3 });
      expect(cappedResult.diffs).toHaveLength(3);
      expect(cappedResult.truncated).toBe(true);

      const fullResult = computeJsonDiff(left, right, { maxDiffs: 10 });
      expect(fullResult.diffs).toHaveLength(5);
      expect(fullResult.truncated).toBe(false);
    });

    describe('maxDiffs and Accurate Truncation Boundary Tests', () => {
      it('returns truncated: false when exactly two differences exist with maxDiffs: 2 followed by unchanged properties', () => {
        const left = { a: 1, b: 2, c: 3, d: 4 };
        const right = { a: 10, b: 20, c: 3, d: 4 };

        const result = computeJsonDiff(left, right, { maxDiffs: 2 });
        expect(result.diffs).toHaveLength(2);
        expect(result.diffs.map((d) => d.path)).toEqual(['$.a', '$.b']);
        expect(result.truncated).toBe(false);
      });

      it('returns truncated: false when exactly two differences exist with maxDiffs: 2 and no remaining properties', () => {
        const left = { a: 1, b: 2 };
        const right = { a: 10, b: 20 };

        const result = computeJsonDiff(left, right, { maxDiffs: 2 });
        expect(result.diffs).toHaveLength(2);
        expect(result.diffs.map((d) => d.path)).toEqual(['$.a', '$.b']);
        expect(result.truncated).toBe(false);
      });

      it('returns truncated: true when more than two actual differences exist with maxDiffs: 2', () => {
        const left = { a: 1, b: 2, c: 3 };
        const right = { a: 10, b: 20, c: 30 };

        const result = computeJsonDiff(left, right, { maxDiffs: 2 });
        expect(result.diffs).toHaveLength(2);
        expect(result.diffs.map((d) => d.path)).toEqual(['$.a', '$.b']);
        expect(result.truncated).toBe(true);
      });

      it('returns truncated: false for identical documents with maxDiffs: 0', () => {
        const result = computeJsonDiff({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }, { maxDiffs: 0 });
        expect(result.diffs).toHaveLength(0);
        expect(result.truncated).toBe(false);

        const stringRes = compareJsonStrings('{"a": 1}', '{"a": 1}', { maxDiffs: 0 });
        expect(stringRes.diffs).toHaveLength(0);
        expect(stringRes.truncated).toBe(false);
        expect(stringRes.isIdentical).toBe(true);
      });

      it('returns truncated: true for differing documents with maxDiffs: 0', () => {
        const result = computeJsonDiff({ a: 1 }, { a: 2 }, { maxDiffs: 0 });
        expect(result.diffs).toHaveLength(0);
        expect(result.truncated).toBe(true);

        const stringRes = compareJsonStrings('{"a": 1}', '{"a": 2}', { maxDiffs: 0 });
        expect(stringRes.diffs).toHaveLength(0);
        expect(stringRes.truncated).toBe(true);
        expect(stringRes.isIdentical).toBe(false);
      });

      it('accurately detects truncation in nested objects when limit is reached', () => {
        // Limit reached with remaining nested subtrees unchanged
        const leftUnchanged = { x: { a: 1, b: 2 }, y: { c: 3, d: 4 } };
        const rightUnchanged = { x: { a: 10, b: 20 }, y: { c: 3, d: 4 } };
        const resUnchanged = computeJsonDiff(leftUnchanged, rightUnchanged, { maxDiffs: 2 });
        expect(resUnchanged.diffs).toHaveLength(2);
        expect(resUnchanged.truncated).toBe(false);

        // Limit reached with additional differences in remaining nested subtrees
        const leftChanged = { x: { a: 1, b: 2 }, y: { c: 3, d: 4 } };
        const rightChanged = { x: { a: 10, b: 20 }, y: { c: 30, d: 4 } };
        const resChanged = computeJsonDiff(leftChanged, rightChanged, { maxDiffs: 2 });
        expect(resChanged.diffs).toHaveLength(2);
        expect(resChanged.truncated).toBe(true);
      });

      it('accurately detects truncation in arrays when limit is reached', () => {
        // Overlapping indices unchanged after limit
        const leftArr = [1, 2, 3, 4];
        const rightArr = [10, 20, 3, 4];
        const resArr = computeJsonDiff(leftArr, rightArr, { maxDiffs: 2 });
        expect(resArr.diffs).toHaveLength(2);
        expect(resArr.truncated).toBe(false);

        // Additional change in remaining array elements
        const leftArrMore = [1, 2, 3, 4];
        const rightArrMore = [10, 20, 30, 4];
        const resArrMore = computeJsonDiff(leftArrMore, rightArrMore, { maxDiffs: 2 });
        expect(resArrMore.diffs).toHaveLength(2);
        expect(resArrMore.truncated).toBe(true);

        // Excess length elements beyond limit trigger truncation
        const leftShort = [1, 2];
        const rightLong = [10, 20, 30];
        const resLen = computeJsonDiff(leftShort, rightLong, { maxDiffs: 2 });
        expect(resLen.diffs).toHaveLength(2);
        expect(resLen.truncated).toBe(true);
      });
    });

    describe('Numeric Options Normalization & Extreme Bounds', () => {
      it('safely normalizes maxDiffs across unexpected and boundary values', () => {
        expect(normalizeLimit(undefined)).toBe(DEFAULT_MAX_DIFFS);
        expect(normalizeLimit(NaN)).toBe(DEFAULT_MAX_DIFFS);
        expect(normalizeLimit('invalid')).toBe(DEFAULT_MAX_DIFFS);
        expect(normalizeLimit(null)).toBe(DEFAULT_MAX_DIFFS);
        expect(normalizeLimit({})).toBe(DEFAULT_MAX_DIFFS);

        expect(normalizeLimit(Infinity)).toBe(UPPER_MAX_DIFFS);
        expect(normalizeLimit(-Infinity)).toBe(0);
        expect(normalizeLimit(-100)).toBe(0);
        expect(normalizeLimit(0)).toBe(0);
        expect(normalizeLimit(2.9)).toBe(2);
        expect(normalizeLimit(100)).toBe(100);
      });

      it('safely normalizes maxDepth across unexpected and boundary values', () => {
        expect(normalizeDepth(undefined)).toBe(DEFAULT_MAX_DEPTH);
        expect(normalizeDepth(NaN)).toBe(DEFAULT_MAX_DEPTH);
        expect(normalizeDepth('invalid')).toBe(DEFAULT_MAX_DEPTH);
        expect(normalizeDepth(null)).toBe(DEFAULT_MAX_DEPTH);

        expect(normalizeDepth(Infinity)).toBe(UPPER_MAX_DEPTH);
        expect(normalizeDepth(-Infinity)).toBe(0);
        expect(normalizeDepth(-50)).toBe(0);
        expect(normalizeDepth(0)).toBe(0);
        expect(normalizeDepth(3.7)).toBe(3);
        expect(normalizeDepth(20)).toBe(20);
      });

      it('enforces maxDepth: 0 evaluating only the root boundary', () => {
        // Equal root values with maxDepth: 0
        const equalRes = computeJsonDiff({ a: 1 }, { a: 1 }, { maxDepth: 0 });
        expect(equalRes.diffs).toHaveLength(0);
        expect(equalRes.truncated).toBe(false);

        // Unequal root values with maxDepth: 0
        const diffRes = computeJsonDiff({ a: 1 }, { a: 2 }, { maxDepth: 0 });
        expect(diffRes.diffs).toHaveLength(1);
        expect(diffRes.diffs[0].path).toBe('$');
        expect(diffRes.diffs[0].type).toBe('modified');
        expect(diffRes.truncated).toBe(false);
      });

      it('enforces fractional and extreme maxDepth options in computeJsonDiff', () => {
        // Decimal maxDepth: 1.8 floored to 1
        const left = { a: { b: { c: 1 } } };
        const right = { a: { b: { c: 2 } } };
        const res = computeJsonDiff(left, right, { maxDepth: 1.8 });
        expect(res.diffs).toHaveLength(1);
        expect(res.diffs[0].path).toBe('$.a');
        expect(res.diffs[0].type).toBe('modified');

        // Negative maxDepth clamped to 0
        const resNeg = computeJsonDiff(left, right, { maxDepth: -10 });
        expect(resNeg.diffs).toHaveLength(1);
        expect(resNeg.diffs[0].path).toBe('$');

        // NaN maxDepth falls back to default
        const resNaN = computeJsonDiff(left, right, { maxDepth: NaN });
        expect(resNaN.diffs).toHaveLength(1);
        expect(resNaN.diffs[0].path).toBe('$.a.b.c');
      });

      it('enforces fractional and extreme maxDiffs options in computeJsonDiff', () => {
        const left = { a: 1, b: 2, c: 3 };
        const right = { a: 10, b: 20, c: 30 };

        // Decimal maxDiffs: 1.9 floored to 1
        const resDec = computeJsonDiff(left, right, { maxDiffs: 1.9 });
        expect(resDec.diffs).toHaveLength(1);
        expect(resDec.truncated).toBe(true);

        // Negative maxDiffs clamped to 0
        const resNeg = computeJsonDiff(left, right, { maxDiffs: -5 });
        expect(resNeg.diffs).toHaveLength(0);
        expect(resNeg.truncated).toBe(true);

        // NaN maxDiffs falls back to default limit (capturing all 3)
        const resNaN = computeJsonDiff(left, right, { maxDiffs: NaN });
        expect(resNaN.diffs).toHaveLength(3);
        expect(resNaN.truncated).toBe(false);
      });
    });
  });
});
