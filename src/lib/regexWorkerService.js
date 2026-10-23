import { DEFAULT_REGEX_TIMEOUT_MS } from './regexUtils.js';

/**
 * Instantiates a dedicated Web Worker for off-thread regular expression evaluation.
 * Returns null if the current environment does not support Web Workers.
 *
 * @returns {Worker | null}
 */
export function createRegexWorker() {
  if (typeof Worker === 'undefined') {
    return null;
  }
  try {
    return new Worker(new URL('../workers/regexWorker.js', import.meta.url), {
      type: 'module',
    });
  } catch {
    return null;
  }
}

export { DEFAULT_REGEX_TIMEOUT_MS };
