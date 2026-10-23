/**
 * Pure encoding and decoding utility functions for DevLens Encode/Decode Lab.
 * All operations execute strictly in-memory in the browser using native APIs
 * (TextEncoder, TextDecoder, btoa, atob, encodeURIComponent, encodeURI).
 * No external dependencies, eval(), or dangerous DOM injections are used.
 */

export const MAX_ENCODE_INPUT_LENGTH = 1000000; // 1 MB text limit
export const MAX_ENCODE_OUTPUT_LENGTH = 4000000; // 4 MB output safety guard

export const MODES = {
  BASE64: 'base64',
  BASE64_URL: 'base64url',
  URL_COMPONENT: 'url-component',
  URL_FULL: 'url-full',
  HTML_ENTITIES: 'html-entities',
  HEX: 'hex',
};

export const MODE_LABELS = {
  [MODES.BASE64]: 'Base64',
  [MODES.BASE64_URL]: 'Base64URL',
  [MODES.URL_COMPONENT]: 'URL Component',
  [MODES.URL_FULL]: 'Full URL',
  [MODES.HTML_ENTITIES]: 'HTML Entities',
  [MODES.HEX]: 'Hex Bytes',
};

export const DIRECTIONS = {
  ENCODE: 'encode',
  DECODE: 'decode',
};

export const SAMPLE_TEXT = `DevLens — Privacy-First Developer Toolkit 🚀
Unicode: हिंदी (Hindi), 日本語 (Japanese), Café & Crème brûlée
Query: search="devlens toolkit"&lang=en#features
HTML: <div class="badge" data-id='42'>DevLens & Co.</div>`;

/**
 * Calculates UTF-8 byte length of a string safely.
 *
 * @param {string} text
 * @returns {number}
 */
export function getUtf8ByteLength(text) {
  if (typeof text !== 'string') return 0;
  return new TextEncoder().encode(text).length;
}

/**
 * Converts a UTF-8 Uint8Array into a binary string in chunks to prevent V8 stack overflow.
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function uint8ArrayToBinaryString(bytes) {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return binary;
}

/**
 * Converts a binary string into a Uint8Array.
 *
 * @param {string} binary
 * @returns {Uint8Array}
 */
function binaryStringToUint8Array(binary) {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Standard Base64 Encoding (RFC 4648 §4) with full UTF-8 Unicode support.
 *
 * @param {string} text
 * @returns {string}
 */
export function encodeBase64(text) {
  if (text === '') return '';
  const utf8Bytes = new TextEncoder().encode(text);
  const binary = uint8ArrayToBinaryString(utf8Bytes);
  return btoa(binary);
}

/**
 * Standard Base64 Decoding (RFC 4648 §4) with strict alphabet, padding validation,
 * and fatal UTF-8 decoding.
 *
 * @param {string} input
 * @returns {string}
 */
export function decodeBase64(input) {
  if (input === '') return '';

  // Clean allowed whitespace (newlines, spaces, tabs) often introduced in copied base64
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned === '') return '';

  // Check for Base64URL characters
  if (/[_-]/.test(cleaned)) {
    throw new Error(
      'Invalid Base64 string: contains URL-safe characters ("-" or "_"). Use Base64URL mode to decode URL-safe Base64.'
    );
  }

  // Length must be a multiple of 4
  if (cleaned.length % 4 !== 0) {
    throw new Error(
      `Invalid Base64 length (${cleaned.length}): standard Base64 string length must be an exact multiple of 4 with padding.`
    );
  }

  // Strict Base64 alphabet and padding check:
  // Must be [A-Za-z0-9+/], ending in at most 2 '=' padding characters.
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Regex.test(cleaned)) {
    throw new Error(
      'Invalid Base64 string: contains illegal characters or misplaced padding. Only A-Z, a-z, 0-9, +, / and trailing = are allowed.'
    );
  }

  let binary;
  try {
    binary = atob(cleaned);
  } catch (err) {
    throw new Error(
      `Base64 decode failed: ${err instanceof Error ? err.message : 'Malformed Base64 payload.'}`
    );
  }

  const bytes = binaryStringToUint8Array(binary);
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(bytes);
  } catch (err) {
    throw new Error(
      `Malformed UTF-8 sequence: decoded bytes do not represent valid UTF-8 text (${err instanceof Error ? err.message : 'byte decoding error'}).`
    );
  }
}

/**
 * URL-Safe Base64URL Encoding (RFC 4648 §5).
 * Replaces + with -, / with _, and strips padding =.
 *
 * @param {string} text
 * @returns {string}
 */
export function encodeBase64Url(text) {
  if (text === '') return '';
  const standard = encodeBase64(text);
  return standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * URL-Safe Base64URL Decoding (RFC 4648 §5).
 * Supports both padded and unpadded Base64URL strings with strict validation.
 *
 * @param {string} input
 * @returns {string}
 */
export function decodeBase64Url(input) {
  if (input === '') return '';

  const cleaned = input.replace(/\s+/g, '');
  if (cleaned === '') return '';

  // Check for standard Base64 characters not allowed in Base64URL
  if (/[+/]/.test(cleaned)) {
    throw new Error(
      'Invalid Base64URL string: contains standard Base64 characters ("+" or "/"). Use Standard Base64 mode to decode.'
    );
  }

  // Base64 cannot have length remainder 1 mod 4
  if (cleaned.length % 4 === 1) {
    throw new Error(
      `Invalid Base64URL length (${cleaned.length}): Base64 encoding cannot produce a 1-character remnant.`
    );
  }

  // Base64URL alphabet check: [A-Za-z0-9_-] with optional trailing '='
  const base64UrlRegex = /^[A-Za-z0-9_-]+={0,2}$/;
  if (!base64UrlRegex.test(cleaned)) {
    throw new Error(
      'Invalid Base64URL string: contains illegal characters. Only A-Z, a-z, 0-9, -, _ and optional trailing = are allowed.'
    );
  }

  // Convert Base64URL to standard Base64 and add missing padding
  let base64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padLength);

  let binary;
  try {
    binary = atob(base64);
  } catch (err) {
    throw new Error(
      `Base64URL decode failed: ${err instanceof Error ? err.message : 'Malformed Base64URL payload.'}`
    );
  }

  const bytes = binaryStringToUint8Array(binary);
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(bytes);
  } catch (err) {
    throw new Error(
      `Malformed UTF-8 sequence in Base64URL payload: decoded bytes do not represent valid UTF-8 text (${err instanceof Error ? err.message : 'byte decoding error'}).`
    );
  }
}

/**
 * URL Component Encoding using encodeURIComponent.
 *
 * @param {string} text
 * @returns {string}
 */
export function encodeUrlComponent(text) {
  if (text === '') return '';
  return encodeURIComponent(text);
}

/**
 * URL Component Decoding using decodeURIComponent with clear error diagnostics.
 *
 * @param {string} input
 * @returns {string}
 */
export function decodeUrlComponent(input) {
  if (input === '') return '';
  try {
    return decodeURIComponent(input);
  } catch (err) {
    throw new Error(
      `Malformed URL component: ${err instanceof Error ? err.message : 'invalid percent-encoding sequence'}. Check for trailing '%' or incomplete hex triplets.`
    );
  }
}

/**
 * Full URL Encoding using encodeURI (preserves URL delimiters like ://, ?, #, &).
 *
 * @param {string} text
 * @returns {string}
 */
export function encodeUrlFull(text) {
  if (text === '') return '';
  return encodeURI(text);
}

/**
 * Full URL Decoding using decodeURI with clear error diagnostics.
 *
 * @param {string} input
 * @returns {string}
 */
export function decodeUrlFull(input) {
  if (input === '') return '';
  try {
    return decodeURI(input);
  } catch (err) {
    throw new Error(
      `Malformed URI: ${err instanceof Error ? err.message : 'invalid percent-encoding sequence'}. Check for incomplete hex sequences.`
    );
  }
}

/**
 * Well-defined safe dictionary of HTML named entities.
 */
const HTML_NAMED_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&nbsp;': '\u00A0',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&euro;': '€',
  '&pound;': '£',
  '&yen;': '¥',
  '&cent;': '¢',
  '&deg;': '°',
  '&plusmn;': '±',
  '&para;': '¶',
  '&middot;': '·',
  '&bull;': '•',
  '&hellip;': '…',
  '&prime;': '′',
  '&Prime;': '″',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&ndash;': '–',
  '&mdash;': '—',
  '&larr;': '←',
  '&rarr;': '→',
  '&uarr;': '↑',
  '&darr;': '↓',
  '&harr;': '↔',
  '&ne;': '≠',
  '&le;': '≤',
  '&ge;': '≥',
  '&asymp;': '≈',
  '&times;': '×',
  '&divide;': '÷',
  '&micro;': 'µ',
  '&laquo;': '«',
  '&raquo;': '»',
};

/**
 * Encodes special characters into safe HTML entities without innerHTML.
 *
 * @param {string} text
 * @returns {string}
 */
export function encodeHtmlEntities(text) {
  if (text === '') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely decodes HTML entities (named, decimal &#123;, hex &#x1F600;)
 * strictly via deterministic parser without ever touching DOM innerHTML.
 *
 * @param {string} input
 * @returns {string}
 */
export function decodeHtmlEntities(input) {
  if (input === '') return '';

  return input.replace(/&(#?[a-zA-Z0-9]+);/g, (match, entity) => {
    // 1. Check named entity dictionary
    if (Object.prototype.hasOwnProperty.call(HTML_NAMED_ENTITIES, match)) {
      return HTML_NAMED_ENTITIES[match];
    }

    // Case-insensitive fallback for common named entities
    const lowerMatch = match.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(HTML_NAMED_ENTITIES, lowerMatch)) {
      return HTML_NAMED_ENTITIES[lowerMatch];
    }

    // 2. Hexadecimal entity: &#x...; or &#X...;
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const hexStr = entity.slice(2);
      if (/^[0-9a-fA-F]+$/.test(hexStr)) {
        const codePoint = parseInt(hexStr, 16);
        if (
          codePoint >= 0 &&
          codePoint <= 0x10ffff &&
          !(codePoint >= 0xd800 && codePoint <= 0xdfff)
        ) {
          try {
            return String.fromCodePoint(codePoint);
          } catch {
            return match;
          }
        }
      }
      return match;
    }

    // 3. Decimal entity: &#...;
    if (entity.startsWith('#')) {
      const decStr = entity.slice(1);
      if (/^[0-9]+$/.test(decStr)) {
        const codePoint = parseInt(decStr, 10);
        if (
          codePoint >= 0 &&
          codePoint <= 0x10ffff &&
          !(codePoint >= 0xd800 && codePoint <= 0xdfff)
        ) {
          try {
            return String.fromCodePoint(codePoint);
          } catch {
            return match;
          }
        }
      }
      return match;
    }

    // Unrecognized entity: leave unchanged
    return match;
  });
}

/**
 * Encodes text into space-separated hexadecimal UTF-8 bytes.
 *
 * @param {string} text
 * @returns {string}
 */
export function encodeHex(text) {
  if (text === '') return '';
  const utf8Bytes = new TextEncoder().encode(text);
  const hexParts = [];
  for (let i = 0; i < utf8Bytes.length; i++) {
    hexParts.push(utf8Bytes[i].toString(16).padStart(2, '0'));
  }
  return hexParts.join(' ');
}

/**
 * Decodes hexadecimal UTF-8 bytes into text with strict validation.
 * Supports continuous, space-separated, colon-separated, comma-separated, and 0x-prefixed hex strings.
 *
 * @param {string} input
 * @returns {string}
 */
export function decodeHex(input) {
  if (input === '') return '';

  // Sanitize: strip 0x prefixes, whitespace, commas, and colons
  const sanitized = input.replace(/0x/gi, '').replace(/[\s,:]+/g, '');
  if (sanitized === '') return '';

  // Validate character set: only hexadecimal digits
  if (/[^0-9a-fA-F]/.test(sanitized)) {
    throw new Error(
      'Invalid Hex string: contains non-hexadecimal characters. Only 0-9, a-f, and A-F are allowed.'
    );
  }

  // Length must be even (each byte consists of 2 hex characters)
  if (sanitized.length % 2 !== 0) {
    throw new Error(
      `Invalid Hex string length (${sanitized.length}): hex byte sequence must contain an even number of characters (2 hex digits per byte).`
    );
  }

  const byteCount = sanitized.length / 2;
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = parseInt(sanitized.slice(i * 2, i * 2 + 2), 16);
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(bytes);
  } catch (err) {
    throw new Error(
      `Malformed UTF-8 byte sequence in hex data: bytes do not represent valid UTF-8 text (${err instanceof Error ? err.message : 'byte decoding error'}).`
    );
  }
}

/**
 * Master transformation function handling mode selection, direction, length boundaries,
 * and unified error dispatch.
 *
 * @param {string} input - Raw user input
 * @param {'base64' | 'base64url' | 'url-component' | 'url-full' | 'html-entities' | 'hex'} mode
 * @param {'encode' | 'decode'} direction
 * @returns {{ output: string, error: string | null, isEmpty: boolean }}
 */
export function transformText(input, mode, direction) {
  if (typeof input !== 'string') {
    return { output: '', error: null, isEmpty: true };
  }

  if (input.length > MAX_ENCODE_INPUT_LENGTH) {
    return {
      output: '',
      error: `Input exceeds maximum allowed size of 1 MB (${MAX_ENCODE_INPUT_LENGTH.toLocaleString()} characters).`,
      isEmpty: false,
    };
  }

  if (input === '') {
    return { output: '', error: null, isEmpty: true };
  }

  try {
    let result = '';

    if (direction === DIRECTIONS.ENCODE) {
      switch (mode) {
        case MODES.BASE64:
          result = encodeBase64(input);
          break;
        case MODES.BASE64_URL:
          result = encodeBase64Url(input);
          break;
        case MODES.URL_COMPONENT:
          result = encodeUrlComponent(input);
          break;
        case MODES.URL_FULL:
          result = encodeUrlFull(input);
          break;
        case MODES.HTML_ENTITIES:
          result = encodeHtmlEntities(input);
          break;
        case MODES.HEX:
          result = encodeHex(input);
          break;
        default:
          throw new Error(`Unsupported encoding mode: ${mode}`);
      }
    } else if (direction === DIRECTIONS.DECODE) {
      switch (mode) {
        case MODES.BASE64:
          result = decodeBase64(input);
          break;
        case MODES.BASE64_URL:
          result = decodeBase64Url(input);
          break;
        case MODES.URL_COMPONENT:
          result = decodeUrlComponent(input);
          break;
        case MODES.URL_FULL:
          result = decodeUrlFull(input);
          break;
        case MODES.HTML_ENTITIES:
          result = decodeHtmlEntities(input);
          break;
        case MODES.HEX:
          result = decodeHex(input);
          break;
        default:
          throw new Error(`Unsupported decoding mode: ${mode}`);
      }
    } else {
      throw new Error(`Unsupported transformation direction: ${direction}`);
    }

    if (result.length > MAX_ENCODE_OUTPUT_LENGTH) {
      return {
        output: '',
        error: `Transformed output exceeded safe length limit of 4 MB (${MAX_ENCODE_OUTPUT_LENGTH.toLocaleString()} characters).`,
        isEmpty: false,
      };
    }

    return { output: result, error: null, isEmpty: false };
  } catch (err) {
    return {
      output: '',
      error: err instanceof Error ? err.message : String(err),
      isEmpty: false,
    };
  }
}
