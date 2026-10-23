/**
 * Pure JSON manipulation utilities for DevLens JSON Studio.
 * All operations use native JSON.parse and JSON.stringify without external libraries or eval().
 */

/**
 * Maximum supported input size for browser JSON operations (5 MB / 5,000,000 characters).
 * Protects memory allocation and UI responsiveness against runaway inputs.
 */
export const MAX_JSON_INPUT_LENGTH = 5000000;

/**
 * Format raw JSON text with standard indentation.
 * Throws a SyntaxError if the input is not valid JSON.
 * Throws a RangeError if the input exceeds the maximum supported size.
 *
 * @param {string} input - Raw JSON string
 * @param {number} [indent=2] - Indentation spaces
 * @returns {string} Formatted JSON string
 */
export function formatJson(input, indent = 2) {
  if (typeof input !== 'string') {
    throw new SyntaxError('Input cannot be empty. Please provide a valid JSON string.');
  }

  if (input.length > MAX_JSON_INPUT_LENGTH) {
    throw new RangeError(
      `Input exceeds maximum supported size of 5 MB (${MAX_JSON_INPUT_LENGTH.toLocaleString()} characters).`
    );
  }

  if (input.trim() === '') {
    throw new SyntaxError('Input cannot be empty. Please provide a valid JSON string.');
  }

  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indent);
}

/**
 * Minify raw JSON text into a compact single-line string.
 * Throws a SyntaxError if the input is not valid JSON.
 * Throws a RangeError if the input exceeds the maximum supported size.
 *
 * @param {string} input - Raw JSON string
 * @returns {string} Minified single-line JSON string
 */
export function minifyJson(input) {
  if (typeof input !== 'string') {
    throw new SyntaxError('Input cannot be empty. Please provide a valid JSON string.');
  }

  if (input.length > MAX_JSON_INPUT_LENGTH) {
    throw new RangeError(
      `Input exceeds maximum supported size of 5 MB (${MAX_JSON_INPUT_LENGTH.toLocaleString()} characters).`
    );
  }

  if (input.trim() === '') {
    throw new SyntaxError('Input cannot be empty. Please provide a valid JSON string.');
  }

  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

/**
 * Validate JSON string and return diagnostic information.
 * Correctly distinguishes objects, arrays, string primitives, numbers, booleans, and null.
 *
 * @param {string} input - Raw JSON string
 * @returns {{ isValid: boolean, error: string | null, type?: string | null, details?: string | null, message?: string }}
 */
export function validateJson(input) {
  if (typeof input !== 'string') {
    return {
      isValid: false,
      error: 'Input cannot be empty. Please provide a valid JSON string.',
      type: null,
      details: null,
    };
  }

  if (input.length > MAX_JSON_INPUT_LENGTH) {
    return {
      isValid: false,
      error: `Input exceeds maximum supported size of 5 MB (${MAX_JSON_INPUT_LENGTH.toLocaleString()} characters).`,
      type: null,
      details: null,
    };
  }

  if (input.trim() === '') {
    return {
      isValid: false,
      error: 'Input cannot be empty. Please provide a valid JSON string.',
      type: null,
      details: null,
    };
  }

  try {
    const parsed = JSON.parse(input);
    let type = typeof parsed;
    let details = '';

    if (parsed === null) {
      type = 'null';
      details = 'Null primitive value';
    } else if (Array.isArray(parsed)) {
      type = 'array';
      details = `Array with ${parsed.length} item${parsed.length === 1 ? '' : 's'}`;
    } else if (type === 'object') {
      const keyCount = Object.keys(parsed).length;
      details = `Object with ${keyCount} key${keyCount === 1 ? '' : 's'}`;
    } else if (type === 'string') {
      details = `String primitive (${parsed.length} character${parsed.length === 1 ? '' : 's'})`;
    } else if (type === 'number') {
      details = `Number primitive (${parsed})`;
    } else if (type === 'boolean') {
      details = `Boolean primitive (${parsed})`;
    }

    return {
      isValid: true,
      error: null,
      type,
      details,
      message: `Valid JSON syntax — ${details}`,
    };
  } catch (err) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : 'Invalid JSON syntax',
      type: null,
      details: null,
    };
  }
}

/**
 * Calculate statistical metrics for a text string.
 *
 * @param {string} text - Input or output text
 * @returns {{ characters: number, lines: number, byteSize: number }}
 */
export function getJsonStats(text) {
  if (!text) {
    return { characters: 0, lines: 0, byteSize: 0 };
  }

  const characters = text.length;
  const lines = text.split('\n').length;
  // Compute byte size using TextEncoder when available
  let byteSize = characters;
  if (typeof TextEncoder !== 'undefined') {
    byteSize = new TextEncoder().encode(text).length;
  }

  return { characters, lines, byteSize };
}
