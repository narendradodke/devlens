/**
 * Pure JSON manipulation utilities for DevLens JSON Studio.
 * All operations use native JSON.parse and JSON.stringify without external libraries or eval().
 */

/**
 * Format raw JSON text with standard indentation.
 * Throws a SyntaxError if the input is not valid JSON.
 *
 * @param {string} input - Raw JSON string
 * @param {number} [indent=2] - Indentation spaces
 * @returns {string} Formatted JSON string
 */
export function formatJson(input, indent = 2) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new SyntaxError('Input cannot be empty. Please provide a valid JSON string.');
  }

  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indent);
}

/**
 * Minify raw JSON text into a compact single-line string.
 * Throws a SyntaxError if the input is not valid JSON.
 *
 * @param {string} input - Raw JSON string
 * @returns {string} Minified single-line JSON string
 */
export function minifyJson(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new SyntaxError('Input cannot be empty. Please provide a valid JSON string.');
  }

  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

/**
 * Validate JSON string and return diagnostic information.
 *
 * @param {string} input - Raw JSON string
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateJson(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    return {
      isValid: false,
      error: 'Input is empty.',
    };
  }

  try {
    JSON.parse(input);
    return {
      isValid: true,
      error: null,
    };
  } catch (err) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : 'Invalid JSON syntax',
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
