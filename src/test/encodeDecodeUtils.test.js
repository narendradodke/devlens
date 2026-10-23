import { describe, it, expect } from 'vitest';
import {
  MODES,
  DIRECTIONS,
  MAX_ENCODE_INPUT_LENGTH,
  SAMPLE_TEXT,
  getUtf8ByteLength,
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
  encodeUrlComponent,
  decodeUrlComponent,
  encodeUrlFull,
  decodeUrlFull,
  encodeHtmlEntities,
  decodeHtmlEntities,
  encodeHex,
  decodeHex,
  transformText,
} from '../lib/encodeDecodeUtils';

describe('encodeDecodeUtils Unit Tests', () => {
  describe('getUtf8ByteLength', () => {
    it('accurately calculates byte length for ASCII and multi-byte Unicode', () => {
      expect(getUtf8ByteLength('')).toBe(0);
      expect(getUtf8ByteLength('Hello')).toBe(5);
      expect(getUtf8ByteLength('Café')).toBe(5); // 'é' is 2 bytes in UTF-8
      expect(getUtf8ByteLength('हिंदी')).toBe(15);
      expect(getUtf8ByteLength('日本語')).toBe(9);
      expect(getUtf8ByteLength('🚀')).toBe(4); // Astral emoji is 4 bytes
      expect(getUtf8ByteLength(null)).toBe(0);
    });
  });

  describe('Standard Base64 (RFC 4648 §4)', () => {
    it('encodes standard RFC 4648 test vectors correctly', () => {
      expect(encodeBase64('')).toBe('');
      expect(encodeBase64('f')).toBe('Zg==');
      expect(encodeBase64('fo')).toBe('Zm8=');
      expect(encodeBase64('foo')).toBe('Zm9v');
      expect(encodeBase64('foob')).toBe('Zm9vYg==');
      expect(encodeBase64('fooba')).toBe('Zm9vYmE=');
      expect(encodeBase64('foobar')).toBe('Zm9vYmFy');
    });

    it('decodes standard RFC 4648 test vectors correctly', () => {
      expect(decodeBase64('')).toBe('');
      expect(decodeBase64('Zg==')).toBe('f');
      expect(decodeBase64('Zm8=')).toBe('fo');
      expect(decodeBase64('Zm9v')).toBe('foo');
      expect(decodeBase64('Zm9vYg==')).toBe('foob');
      expect(decodeBase64('Zm9vYmE=')).toBe('fooba');
      expect(decodeBase64('Zm9vYmFy')).toBe('foobar');
    });

    it('handles multi-byte Unicode, Hindi, Japanese, and astral plane emojis with round-trip fidelity', () => {
      const unicodeSample = 'DevLens 🚀 हिंदी (Hindi), 日本語 (Japanese), Café Crème';
      const encoded = encodeBase64(unicodeSample);
      expect(decodeBase64(encoded)).toBe(unicodeSample);
    });

    it('allows valid Base64 with whitespace, newlines, and carriage returns', () => {
      const multiline = 'Zm9v\n  YmFy\r\n';
      expect(decodeBase64(multiline)).toBe('foobar');
    });

    it('rejects Base64 with invalid length (not a multiple of 4)', () => {
      expect(() => decodeBase64('Zm9vY')).toThrow(/Invalid Base64 length/);
      expect(() => decodeBase64('Zg=')).toThrow(/Invalid Base64 length/);
    });

    it('rejects Base64 containing URL-safe characters (- or _) with a helpful message', () => {
      expect(() => decodeBase64('abc-123_')).toThrow(/contains URL-safe characters/);
    });

    it('rejects Base64 containing illegal characters', () => {
      expect(() => decodeBase64('Zg==!@#$')).toThrow(/contains illegal characters/);
    });

    it('rejects Base64 with misplaced or excessive padding', () => {
      expect(() => decodeBase64('====')).toThrow(
        /contains illegal characters or misplaced padding/
      );
      expect(() => decodeBase64('Z=g=')).toThrow(
        /contains illegal characters or misplaced padding/
      );
    });

    it('rejects non-UTF-8 byte sequences with fatal decoding error', () => {
      // 0xFF 0xFF encoded as Base64 is "//8=" which is not valid UTF-8
      expect(() => decodeBase64('//8=')).toThrow(/Malformed UTF-8 sequence/);
    });
  });

  describe('Base64URL (RFC 4648 §5)', () => {
    it('encodes using - and _ and omits trailing = padding', () => {
      // '>>> ???' in standard Base64 produces 'Pj4+ID8/Pw==' (contains + and / and =)
      const input = '>>> ???';
      const standard = encodeBase64(input);
      expect(standard).toContain('+');
      expect(standard).toContain('/');
      expect(standard).toContain('=');

      const urlSafe = encodeBase64Url(input);
      expect(urlSafe).not.toContain('+');
      expect(urlSafe).not.toContain('/');
      expect(urlSafe).not.toContain('=');
      expect(urlSafe).toContain('-');
      expect(urlSafe).toContain('_');
    });

    it('decodes both unpadded and padded Base64URL strings', () => {
      const text = 'DevLens Base64URL Test 🚀';
      const encodedUnpadded = encodeBase64Url(text);
      expect(encodedUnpadded).not.toContain('=');

      // Unpadded decode
      expect(decodeBase64Url(encodedUnpadded)).toBe(text);

      // Padded decode
      const padded = encodedUnpadded + '='.repeat((4 - (encodedUnpadded.length % 4)) % 4);
      expect(decodeBase64Url(padded)).toBe(text);
    });

    it('rejects Base64URL containing standard characters (+ or /)', () => {
      expect(() => decodeBase64Url('abc+def/')).toThrow(/contains standard Base64 characters/);
    });

    it('rejects Base64URL with invalid length remainder 1 mod 4', () => {
      expect(() => decodeBase64Url('a')).toThrow(/Invalid Base64URL length/);
      expect(() => decodeBase64Url('abcde')).toThrow(/Invalid Base64URL length/);
    });

    it('rejects Base64URL containing illegal characters', () => {
      expect(() => decodeBase64Url('abc$def')).toThrow(/contains illegal characters/);
    });
  });

  describe('URL Component (encodeURIComponent / decodeURIComponent)', () => {
    it('encodes reserved characters, query delimiters, and Unicode', () => {
      const input = 'key=value & name=DevLens? / # [ ]';
      const encoded = encodeUrlComponent(input);
      expect(encoded).toContain('%26');
      expect(encoded).toContain('%3D');
      expect(encoded).toContain('%3F');
      expect(encoded).toContain('%2F');
      expect(encoded).toContain('%23');

      expect(decodeUrlComponent(encoded)).toBe(input);
    });

    it('handles emojis and multi-byte Unicode in URL components', () => {
      const input = 'search=😀&lang=हिंदी';
      const encoded = encodeUrlComponent(input);
      expect(decodeUrlComponent(encoded)).toBe(input);
    });

    it('rejects malformed percent-encoding with clear error diagnostic', () => {
      expect(() => decodeUrlComponent('hello%2')).toThrow(/Malformed URL component/);
      expect(() => decodeUrlComponent('trailing%')).toThrow(/Malformed URL component/);
      expect(() => decodeUrlComponent('%E0%A4%A')).toThrow(/Malformed URL component/);
    });
  });

  describe('Full URL (encodeURI / decodeURI)', () => {
    it('preserves URI protocol, host, path, and query separators while encoding spaces and Unicode', () => {
      const url = 'https://devlens.local/search?q=developer toolkit&lang=fr#top';
      const encoded = encodeUrlFull(url);
      expect(encoded).toContain('https://devlens.local/search?q=developer%20toolkit&lang=fr#top');
      expect(decodeUrlFull(encoded)).toBe(url);
    });

    it('distinguishes Full URL from URL Component (preserves :// and &)', () => {
      const url = 'https://example.com/api?a=1&b=2';
      const fullUrlEncoded = encodeUrlFull(url);
      const componentEncoded = encodeUrlComponent(url);

      expect(fullUrlEncoded).toContain('https://example.com/api?a=1&b=2');
      expect(componentEncoded).toContain('https%3A%2F%2Fexample.com');
    });

    it('rejects malformed percent-encoding with clear error diagnostic', () => {
      expect(() => decodeUrlFull('https://example.com/%99/')).toThrow(/Malformed URI/);
      expect(() => decodeUrlFull('https://example.com/%')).toThrow(/Malformed URI/);
    });
  });

  describe('HTML Entities', () => {
    it('encodes essential special characters into safe HTML entities', () => {
      const raw = '<div class="main" data-id=\'1\'>Tom & Jerry > Spike</div>';
      const encoded = encodeHtmlEntities(raw);
      expect(encoded).toBe(
        '&lt;div class=&quot;main&quot; data-id=&#39;1&#39;&gt;Tom &amp; Jerry &gt; Spike&lt;/div&gt;'
      );
      expect(decodeHtmlEntities(encoded)).toBe(raw);
    });

    it('decodes named entities reliably', () => {
      expect(decodeHtmlEntities('&amp; &lt; &gt; &quot; &apos; &#39;')).toBe("& < > \" ' '");
      expect(decodeHtmlEntities('&copy; 2026 DevLens &trade;')).toBe('© 2026 DevLens ™');
      expect(decodeHtmlEntities('&euro; 100 &plusmn; 5 &deg;')).toBe('€ 100 ± 5 °');
      expect(decodeHtmlEntities('&larr; Back &rarr; Next')).toBe('← Back → Next');
      expect(decodeHtmlEntities('&nbsp;')).toBe('\u00A0');
    });

    it('decodes decimal numeric entities (&#123;)', () => {
      expect(decodeHtmlEntities('&#65;&#66;&#67;')).toBe('ABC');
      expect(decodeHtmlEntities('&#169;')).toBe('©');
      expect(decodeHtmlEntities('&#8364;')).toBe('€');
    });

    it('decodes hexadecimal numeric entities (&#x1F600;)', () => {
      expect(decodeHtmlEntities('&#x41;&#x42;&#x43;')).toBe('ABC');
      expect(decodeHtmlEntities('&#x1F600;')).toBe('😀');
      expect(decodeHtmlEntities('&#x1F680;')).toBe('🚀');
    });

    it('leaves unrecognized or invalid entities untouched without throwing', () => {
      expect(decodeHtmlEntities('&notanentity;')).toBe('&notanentity;');
      expect(decodeHtmlEntities('&amp; remaining')).toBe('& remaining');
      expect(decodeHtmlEntities('plain text without entities')).toBe('plain text without entities');
    });
  });

  describe('Hexadecimal UTF-8 Bytes', () => {
    it('encodes text into space-separated lowercase 2-digit hex bytes', () => {
      expect(encodeHex('')).toBe('');
      expect(encodeHex('Hello')).toBe('48 65 6c 6c 6f');
    });

    it('encodes and decodes multi-byte UTF-8 Unicode characters via Hex', () => {
      const text = 'DevLens 🚀 日本語';
      const hex = encodeHex(text);
      expect(decodeHex(hex)).toBe(text);
    });

    it('decodes various hex formats: space-separated, colon-separated, comma-separated, continuous, and 0x-prefixed', () => {
      const expected = 'Hello';
      expect(decodeHex('48 65 6c 6c 6f')).toBe(expected);
      expect(decodeHex('48:65:6c:6c:6f')).toBe(expected);
      expect(decodeHex('48, 65, 6c, 6c, 6f')).toBe(expected);
      expect(decodeHex('48656c6c6f')).toBe(expected);
      expect(decodeHex('0x48 0x65 0x6c 0x6c 0x6f')).toBe(expected);
      expect(decodeHex('0x48656c6c6f')).toBe(expected);
      expect(decodeHex('48 65 6C 6C 6F')).toBe(expected); // Uppercase
    });

    it('rejects hex with odd number of characters', () => {
      expect(() => decodeHex('48656c6c6')).toThrow(/Invalid Hex string length/);
      expect(() => decodeHex('a')).toThrow(/Invalid Hex string length/);
    });

    it('rejects hex with non-hexadecimal characters', () => {
      expect(() => decodeHex('48 65 ZZ 6c 6f')).toThrow(/contains non-hexadecimal characters/);
      expect(() => decodeHex('hello')).toThrow(/contains non-hexadecimal characters/);
    });

    it('rejects invalid UTF-8 byte sequences in hex decoding', () => {
      // FF FF is invalid UTF-8
      expect(() => decodeHex('ff ff')).toThrow(/Malformed UTF-8 byte sequence/);
    });
  });

  describe('transformText Master Dispatcher', () => {
    it('dispatches Encode and Decode across all modes cleanly', () => {
      const modes = [
        MODES.BASE64,
        MODES.BASE64_URL,
        MODES.URL_COMPONENT,
        MODES.URL_FULL,
        MODES.HTML_ENTITIES,
        MODES.HEX,
      ];

      for (const mode of modes) {
        const encRes = transformText('Sample Text 123', mode, DIRECTIONS.ENCODE);
        expect(encRes.error).toBeNull();
        expect(encRes.output).not.toBe('');
        expect(encRes.isEmpty).toBe(false);

        const decRes = transformText(encRes.output, mode, DIRECTIONS.DECODE);
        expect(decRes.error).toBeNull();
        expect(decRes.output).toBe('Sample Text 123');
      }
    });

    it('returns isEmpty: true for empty string or non-string inputs', () => {
      expect(transformText('', MODES.BASE64, DIRECTIONS.ENCODE)).toEqual({
        output: '',
        error: null,
        isEmpty: true,
      });
      expect(transformText(null, MODES.BASE64, DIRECTIONS.ENCODE)).toEqual({
        output: '',
        error: null,
        isEmpty: true,
      });
    });

    it('enforces MAX_ENCODE_INPUT_LENGTH (1,000,000 characters) limit', () => {
      const oversized = 'a'.repeat(MAX_ENCODE_INPUT_LENGTH + 1);
      const result = transformText(oversized, MODES.BASE64, DIRECTIONS.ENCODE);
      expect(result.error).toContain('Input exceeds maximum allowed size of 1 MB');
      expect(result.output).toBe('');
      expect(result.isEmpty).toBe(false);
    });

    it('captures errors cleanly without throwing when input is invalid', () => {
      const result = transformText('invalid base64!!!', MODES.BASE64, DIRECTIONS.DECODE);
      expect(result.error).not.toBeNull();
      expect(result.output).toBe('');
      expect(result.isEmpty).toBe(false);
    });

    it('works flawlessly with built-in SAMPLE_TEXT across all modes', () => {
      const modes = [
        MODES.BASE64,
        MODES.BASE64_URL,
        MODES.URL_COMPONENT,
        MODES.URL_FULL,
        MODES.HTML_ENTITIES,
        MODES.HEX,
      ];

      for (const mode of modes) {
        const enc = transformText(SAMPLE_TEXT, mode, DIRECTIONS.ENCODE);
        expect(enc.error).toBeNull();
        const dec = transformText(enc.output, mode, DIRECTIONS.DECODE);
        expect(dec.error).toBeNull();
        expect(dec.output).toBe(SAMPLE_TEXT);
      }
    });
  });
});
