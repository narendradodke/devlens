import { describe, it, expect } from 'vitest';
import {
  decodeBase64UrlSegment,
  formatTimestampClaim,
  parseJwt,
  SAMPLE_JWT,
} from '../lib/jwtUtils';

/**
 * Helper to encode an object or string to a Base64URL segment.
 */
function toBase64Url(objOrStr) {
  const str = typeof objOrStr === 'string' ? objOrStr : JSON.stringify(objOrStr);
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('jwtUtils Unit Tests', () => {
  describe('decodeBase64UrlSegment', () => {
    it('decodes a valid Base64URL JSON segment', () => {
      const obj = { alg: 'HS256', typ: 'JWT' };
      const segment = toBase64Url(obj);
      const result = decodeBase64UrlSegment(segment, 'header');
      expect(result.data).toEqual(obj);
      expect(JSON.parse(result.rawJson)).toEqual(obj);
    });

    it('handles Base64URL characters with "-" and "_"', () => {
      // Create payload whose base64 representation contains + and / (indices 62 and 63)
      // Byte 251 = 0b11111011, Byte 254 = 0b11111110
      // In JSON, we can use arbitrary keys/values that produce these bytes or test string with special bytes
      const payload = { test: '>>??--//++' };
      const segment = toBase64Url(payload);
      const result = decodeBase64UrlSegment(segment, 'payload');
      expect(result.data).toEqual(payload);
    });

    it('resolves unpadded Base64URL strings correctly', () => {
      // 1 char remainder, 2 char remainder, 3 char remainder
      const obj1 = { a: 1 }; // length variations
      const seg1 = toBase64Url(obj1).replace(/=+$/, '');
      expect(decodeBase64UrlSegment(seg1).data).toEqual(obj1);

      const obj2 = { ab: 12 };
      const seg2 = toBase64Url(obj2).replace(/=+$/, '');
      expect(decodeBase64UrlSegment(seg2).data).toEqual(obj2);

      const obj3 = { abc: 123 };
      const seg3 = toBase64Url(obj3).replace(/=+$/, '');
      expect(decodeBase64UrlSegment(seg3).data).toEqual(obj3);
    });

    it('decodes multi-byte UTF-8 characters (emoji, international text) without corruption', () => {
      const complexData = {
        name: 'DevLens 🔍',
        japanese: 'こんにちは世界',
        german: 'Übergröße',
        hindi: 'नमस्ते डेवलपर',
        arabic: 'مرحبا',
      };
      const segment = toBase64Url(complexData);
      const result = decodeBase64UrlSegment(segment, 'payload');
      expect(result.data).toEqual(complexData);
    });

    it('throws error when segment is empty or not a string', () => {
      expect(() => decodeBase64UrlSegment('', 'header')).toThrow(
        'Invalid JWT: header segment is empty.'
      );
      expect(() => decodeBase64UrlSegment(null, 'payload')).toThrow(
        'Invalid JWT: payload segment is empty.'
      );
    });

    it('throws clean validation error on illegal Base64URL characters', () => {
      // '+' and '/' and '=' are illegal in pure Base64URL input segments
      expect(() => decodeBase64UrlSegment('abc+123', 'payload')).toThrow(
        /illegal characters outside the Base64URL alphabet/
      );
      expect(() => decodeBase64UrlSegment('abc/123', 'payload')).toThrow(
        /illegal characters outside the Base64URL alphabet/
      );
      expect(() => decodeBase64UrlSegment('abc=123', 'payload')).toThrow(
        /illegal characters outside the Base64URL alphabet/
      );
      expect(() => decodeBase64UrlSegment('abc 123', 'payload')).toThrow(
        /illegal characters outside the Base64URL alphabet/
      );
    });

    it('throws descriptive error on malformed JSON', () => {
      // Valid base64url string, but not valid JSON (e.g. "{broken: ")
      const malformed = toBase64Url('{ broken json');
      expect(() => decodeBase64UrlSegment(malformed, 'header')).toThrow(/Invalid JSON in header:/);
    });

    it('throws descriptive error on malformed UTF-8 bytes', () => {
      // 0xc0 0xaf is an invalid overlong UTF-8 sequence
      const invalidUtf8Base64 = btoa(String.fromCharCode(0xc0, 0xaf)).replace(/=/g, '');
      expect(() => decodeBase64UrlSegment(invalidUtf8Base64, 'payload')).toThrow(
        /Malformed UTF-8 sequence in payload:/
      );
    });

    it('throws error when decoded content is not a JSON object (e.g. string, array, number, null)', () => {
      const arraySeg = toBase64Url([1, 2, 3]);
      expect(() => decodeBase64UrlSegment(arraySeg, 'payload')).toThrow(
        'Invalid JWT: payload must decode to a JSON object (found array).'
      );

      const stringSeg = toBase64Url(JSON.stringify('just a string'));
      expect(() => decodeBase64UrlSegment(stringSeg, 'payload')).toThrow(
        'Invalid JWT: payload must decode to a JSON object (found string).'
      );

      const nullSeg = toBase64Url('null');
      expect(() => decodeBase64UrlSegment(nullSeg, 'payload')).toThrow(
        'Invalid JWT: payload must decode to a JSON object (found null).'
      );
    });
  });

  describe('formatTimestampClaim', () => {
    it('formats a valid timestamp number correctly', () => {
      const epochSeconds = 1700000000;
      const result = formatTimestampClaim(epochSeconds);
      expect(result).not.toBeNull();
      expect(result.timestamp).toBe(epochSeconds);
      expect(result.isoString).toBe(new Date(epochSeconds * 1000).toISOString());
      expect(result.dateString).toBe(new Date(epochSeconds * 1000).toLocaleString());
    });

    it('returns null for non-number or invalid timestamp values', () => {
      expect(formatTimestampClaim('1700000000')).toBeNull();
      expect(formatTimestampClaim(null)).toBeNull();
      expect(formatTimestampClaim(undefined)).toBeNull();
      expect(formatTimestampClaim(NaN)).toBeNull();
      expect(formatTimestampClaim(Infinity)).toBeNull();
    });
  });

  describe('parseJwt', () => {
    it('decodes a valid JWT with standard claims correctly', () => {
      const fixedNow = 1700000000000; // ms
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        iss: 'https://auth.example.com',
        sub: 'user_123',
        aud: 'https://api.example.com',
        exp: 1700050000, // future (> fixedNow/1000)
        iat: 1699990000,
        nbf: 1699990000, // past (< fixedNow/1000)
        jti: 'token_xyz',
        customClaim: 'my-value',
      };
      const token = `${toBase64Url(header)}.${toBase64Url(payload)}.c2lnbmF0dXJl`;

      const result = parseJwt(token, fixedNow);

      expect(result.valid).toBe(true);
      expect(result.header).toEqual(header);
      expect(result.payload).toEqual(payload);
      expect(result.signature).toBe('c2lnbmF0dXJl');
      expect(result.claims.iss).toBe('https://auth.example.com');
      expect(result.claims.sub).toBe('user_123');
      expect(result.claims.aud).toBe('https://api.example.com');
      expect(result.claims.jti).toBe('token_xyz');
      expect(result.claims.exp.isExpired).toBe(false);
      expect(result.claims.nbf.isNotYetValid).toBe(false);
      expect(result.claims.iat.timestamp).toBe(1699990000);
    });

    it('parses SAMPLE_JWT successfully', () => {
      const result = parseJwt(SAMPLE_JWT);
      expect(result.valid).toBe(true);
      expect(result.header.alg).toBe('HS256');
      expect(result.payload.iss).toBe('https://auth.devlens.local');
      expect(result.claims.sub).toBe('usr_abc12345');
      expect(result.signature).toBe('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    });

    it('correctly flags an expired token', () => {
      const fixedNow = 1700000000000;
      const header = { alg: 'HS256' };
      const payload = { exp: 1600000000 }; // in the past relative to fixedNow
      const token = `${toBase64Url(header)}.${toBase64Url(payload)}.sig`;

      const result = parseJwt(token, fixedNow);
      expect(result.claims.exp.isExpired).toBe(true);
    });

    it('correctly flags token as expired at the exact expiration instant (now === exp * 1000)', () => {
      const fixedNow = 1700000000000;
      const header = { alg: 'HS256' };
      const payload = { exp: 1700000000 }; // exactly fixedNow / 1000
      const token = `${toBase64Url(header)}.${toBase64Url(payload)}.sig`;

      const result = parseJwt(token, fixedNow);
      expect(result.claims.exp.isExpired).toBe(true);
    });

    it('handles non-numeric or malformed exp/iat/nbf claims safely without throwing', () => {
      const header = { alg: 'HS256' };
      const payload = {
        exp: 'not-a-number',
        iat: null,
        nbf: true,
      };
      const token = `${toBase64Url(header)}.${toBase64Url(payload)}.sig`;

      const result = parseJwt(token);
      expect(result.valid).toBe(true);
      expect(result.claims.exp).toBeUndefined();
      expect(result.claims.iat).toBeUndefined();
      expect(result.claims.nbf).toBeUndefined();
    });

    it('correctly flags a not-yet-valid token', () => {
      const fixedNow = 1700000000000;
      const header = { alg: 'HS256' };
      const payload = { nbf: 1800000000 }; // in the future relative to fixedNow
      const token = `${toBase64Url(header)}.${toBase64Url(payload)}.sig`;

      const result = parseJwt(token, fixedNow);
      expect(result.claims.nbf.isNotYetValid).toBe(true);
    });

    it('handles unsigned tokens (empty signature segment) without crashing', () => {
      const header = { alg: 'none' };
      const payload = { sub: 'guest' };
      const token = `${toBase64Url(header)}.${toBase64Url(payload)}.`;

      const result = parseJwt(token);
      expect(result.valid).toBe(true);
      expect(result.signature).toBe('');
    });

    it('handles missing optional claims gracefully', () => {
      const header = { alg: 'none' };
      const payload = { custom: 'hello' };
      const token = `${toBase64Url(header)}.${toBase64Url(payload)}.sig`;

      const result = parseJwt(token);
      expect(result.claims.iss).toBeUndefined();
      expect(result.claims.sub).toBeUndefined();
      expect(result.claims.exp).toBeUndefined();
      expect(result.claims.iat).toBeUndefined();
      expect(result.claims.nbf).toBeUndefined();
      expect(result.claims.jti).toBeUndefined();
    });

    it('throws error when input has < 3 segments', () => {
      expect(() => parseJwt('abc.def')).toThrow(
        'Invalid JWT structure: Expected exactly 3 dot-separated segments (header.payload.signature), but found 2.'
      );
      expect(() => parseJwt('single-segment-only')).toThrow(
        'Invalid JWT structure: Expected exactly 3 dot-separated segments (header.payload.signature), but found 1.'
      );
    });

    it('throws error when input has > 3 segments', () => {
      expect(() => parseJwt('a.b.c.d')).toThrow(
        'Invalid JWT structure: Expected exactly 3 dot-separated segments (header.payload.signature), but found 4.'
      );
    });

    it('throws error when input is empty or whitespace', () => {
      expect(() => parseJwt('')).toThrow(
        'Token input cannot be empty. Please provide a valid compact JWT.'
      );
      expect(() => parseJwt('   \n  ')).toThrow(
        'Token input cannot be empty. Please provide a valid compact JWT.'
      );
    });

    it('throws error when signature has invalid Base64URL characters', () => {
      const header = toBase64Url({ alg: 'HS256' });
      const payload = toBase64Url({ sub: 'user' });
      const badSig = 'sig+with+plus';
      expect(() => parseJwt(`${header}.${payload}.${badSig}`)).toThrow(
        'Invalid Base64URL encoding in signature: contains illegal characters outside the Base64URL alphabet.'
      );
    });
  });
});
