import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, validateJson, getJsonStats } from '../lib/jsonUtils';

describe('jsonUtils unit tests', () => {
  describe('formatJson', () => {
    it('formats a valid JSON object with default 2-space indent', () => {
      const raw = '{"a":1,"b":"hello"}';
      const expected = '{\n  "a": 1,\n  "b": "hello"\n}';
      expect(formatJson(raw)).toBe(expected);
    });

    it('formats with custom indentation', () => {
      const raw = '{"x":[1,2]}';
      const expected = '{\n    "x": [\n        1,\n        2\n    ]\n}';
      expect(formatJson(raw, 4)).toBe(expected);
    });

    it('handles nested objects, arrays, and primitive values', () => {
      const raw = '{"nested":{"arr":[true,false,null,123.45]}}';
      const formatted = formatJson(raw);
      expect(JSON.parse(formatted)).toEqual({
        nested: { arr: [true, false, null, 123.45] },
      });
    });

    it('throws SyntaxError on malformed JSON', () => {
      const broken = '{"a": 1, trailing,}';
      expect(() => formatJson(broken)).toThrow(SyntaxError);
    });

    it('throws SyntaxError when input is empty or whitespace', () => {
      expect(() => formatJson('')).toThrow(SyntaxError);
      expect(() => formatJson('   ')).toThrow(SyntaxError);
    });
  });

  describe('minifyJson', () => {
    it('minifies formatted JSON to a single line without spaces', () => {
      const formatted = '{\n  "name": "DevLens",\n  "active": true\n}';
      const expected = '{"name":"DevLens","active":true}';
      expect(minifyJson(formatted)).toBe(expected);
    });

    it('minifies arrays and nested structures properly', () => {
      const input = '[\n  1,\n  2,\n  {\n    "k": "v"\n  }\n]';
      expect(minifyJson(input)).toBe('[1,2,{"k":"v"}]');
    });

    it('throws SyntaxError on invalid JSON', () => {
      expect(() => minifyJson('{unquotedKey: 123}')).toThrow(SyntaxError);
      expect(() => minifyJson('')).toThrow(SyntaxError);
    });
  });

  describe('validateJson', () => {
    it('returns isValid true and error null for valid JSON', () => {
      const result = validateJson('{"status": "ok"}');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns isValid false with error message for invalid JSON', () => {
      const result = validateJson('{broken}');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('returns isValid false for empty input', () => {
      const result = validateJson('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('getJsonStats', () => {
    it('computes character count, line count, and byte size', () => {
      const text = '{\n  "a": 1\n}';
      const stats = getJsonStats(text);
      expect(stats.characters).toBe(text.length);
      expect(stats.lines).toBe(3);
      expect(stats.byteSize).toBe(text.length);
    });

    it('handles empty input gracefully', () => {
      const stats = getJsonStats('');
      expect(stats).toEqual({ characters: 0, lines: 0, byteSize: 0 });
    });
  });
});
