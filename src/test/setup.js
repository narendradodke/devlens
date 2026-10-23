import '@testing-library/jest-dom';
import { findMatches } from '../lib/regexUtils.js';

/**
 * Standard in-memory mock for Web Worker in JSDOM / Vitest environments.
 * Allows safe, isolated test execution matching the browser Worker message lifecycle.
 */
if (typeof globalThis.Worker === 'undefined') {
  class DefaultMockWorker {
    constructor() {
      this.terminated = false;
      this.onmessage = null;
      this.onerror = null;
    }

    postMessage(data) {
      if (this.terminated) return;
      try {
        const { id, pattern, flags, text, maxMatches } = data || {};
        const result = findMatches(pattern, flags, text, maxMatches);
        if (!this.terminated) {
          this.onmessage?.({
            data: { id, success: true, result },
          });
        }
      } catch (err) {
        if (!this.terminated) {
          this.onerror?.({
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    terminate() {
      this.terminated = true;
    }

    addEventListener(type, listener) {
      if (type === 'message') this.onmessage = listener;
      if (type === 'error') this.onerror = listener;
    }

    removeEventListener() {}
  }

  globalThis.Worker = DefaultMockWorker;
}
