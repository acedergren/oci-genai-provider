/**
 * Shared test utilities for OCI GenAI packages
 *
 * This package provides common mocks, fixtures, and test helpers
 * used across the monorepo test suites.
 */

// Re-export OCI SDK mocks
export * from './oci-common';
export * from './oci-generativeaiinference';

// Test fixtures and helpers
export const TEST_CONFIG = {
  region: 'eu-frankfurt-1',
  compartmentId: 'ocid1.compartment.oc1..test',
  profile: 'DEFAULT',
} as const;

export const TEST_MODEL_IDS = {
  grok: 'xai.grok-4-maverick',
  llama: 'meta.llama-3.3-70b-instruct',
  cohere: 'cohere.command-r-plus',
  gemini: 'google.gemini-2.5-flash',
} as const;

export const TEST_OCIDS = {
  compartment: 'ocid1.compartment.oc1..test',
  tenancy: 'ocid1.tenancy.oc1..test',
  user: 'ocid1.user.oc1..test',
} as const;
