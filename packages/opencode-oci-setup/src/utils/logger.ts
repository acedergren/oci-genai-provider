/**
 * Logger utility that respects quiet mode
 */

import type { Logger } from '../types.js';

/**
 * Create a logger that respects quiet mode
 */
export function createLogger(quiet: boolean): Logger {
  return {
    log: quiet ? () => {} : console.log,
    error: console.error,
    warn: quiet ? () => {} : console.warn,
  };
}
