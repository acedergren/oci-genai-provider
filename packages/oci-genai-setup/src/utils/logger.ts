/**
 * Logger utility that respects quiet mode
 */
/* eslint-disable no-console */

import type { Logger } from '../types.js';

/**
 * Noop function for quiet mode
 */
const noop = (): void => {
  // Intentionally empty for quiet mode
};

/**
 * Create a logger that respects quiet mode
 */
export function createLogger(quiet: boolean): Logger {
  return {
    log: quiet ? noop : console.log,
    error: console.error,
    warn: quiet ? noop : console.warn,
  };
}
