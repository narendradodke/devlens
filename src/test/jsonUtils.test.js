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

    it('formats valid JSON primitives including null, boolean, and number', () => {
      expect(formatJson('null')).toBe('null');
      expect(formatJson('true')).toBe('true');
      expect(formatJson('123')).toBe('123');
      expect(formatJson('"quoted string"')).toBe('"quoted string"');
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

    it('minifies primitives including null and numbers', () => {
      expect(minifyJson('null')).toBe('null');
      expect(minifyJson('42')).toBe('42');
      expect(minifyJson('"text"')).toBe('"text"');
    });

    it('throws SyntaxError on invalid JSON', () => {
      expect(() => minifyJson('{unquotedKey: 123}')).toThrow(SyntaxError);
      expect(() => minifyJson('')).toThrow(SyntaxError);
    });
  });

  describe('validateJson', () => {
    it('validates JSON objects and reports key count', () => {
      const result = validateJson('{"status": "ok", "code": 200}');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.type).toBe('object');
      expect(result.details).toContain('2 keys');
    });

    it('validates JSON arrays and reports item count', () => {
      const result = validateJson('[1, 2, 3]');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('array');
      expect(result.details).toContain('3 items');
    });

    it('validates null primitive correctly', () => {
      const result = validateJson('null');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('null');
      expect(result.details).toContain('Null primitive');
    });

    it('validates boolean and number primitives', () => {
      expect(validateJson('true').type).toBe('boolean');
      expect(validateJson('999').type).toBe('number');
      expect(validateJson('"sample string"').type).toBe('string');
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

    it('calculates multibyte UTF-8 characters accurately', () => {
      const unicodeText = '{"emoji": "🚀", "currency": "₹"}';
      const stats = getJsonStats(unicodeText);
      expect(stats.byteSize).toBeGreaterThan(stats.characters);
    });

    it('handles empty input gracefully', () => {
      const stats = getJsonStats('');
      expect(stats).toEqual({ characters: 0, lines: 0, byteSize: 0 });
    });
  });
});
