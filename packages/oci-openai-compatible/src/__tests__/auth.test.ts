import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createOCIAuthHeaders, getCompartmentId } from '../auth';
import type { OCIOpenAIConfig } from '../types';

describe('createOCIAuthHeaders', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.OCI_COMPARTMENT_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should create headers with API key', () => {
    const config: OCIOpenAIConfig = {
      apiKey: 'test-key-123',
      compartmentId: 'ocid1.compartment.oc1..test',
    };

    const headers = createOCIAuthHeaders(config);

    expect(headers['Authorization']).toBe('Bearer test-key-123');
    expect(headers['x-oci-compartment-id']).toBe('ocid1.compartment.oc1..test');
  });

  it('should omit Authorization header when no API key provided', () => {
    const config: OCIOpenAIConfig = {
      compartmentId: 'ocid1.compartment.oc1..test',
    };

    const headers = createOCIAuthHeaders(config);

    expect(headers['Authorization']).toBeUndefined();
    expect(headers['x-oci-compartment-id']).toBe('ocid1.compartment.oc1..test');
  });

  it('should use environment variable for compartment ID if not in config', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..env';

    const config: OCIOpenAIConfig = {
      apiKey: 'test-key',
    };

    const headers = createOCIAuthHeaders(config);

    expect(headers['x-oci-compartment-id']).toBe('ocid1.compartment.oc1..env');
  });

  it('should prefer config compartmentId over environment variable', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..env';

    const config: OCIOpenAIConfig = {
      compartmentId: 'ocid1.compartment.oc1..config',
    };

    const headers = createOCIAuthHeaders(config);

    expect(headers['x-oci-compartment-id']).toBe('ocid1.compartment.oc1..config');
  });
});

describe('getCompartmentId', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.OCI_COMPARTMENT_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return config compartmentId if provided', () => {
    const config: OCIOpenAIConfig = {
      compartmentId: 'ocid1.compartment.oc1..test',
    };

    expect(getCompartmentId(config)).toBe('ocid1.compartment.oc1..test');
  });

  it('should return environment variable if config not provided', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..env';

    const config: OCIOpenAIConfig = {};

    expect(getCompartmentId(config)).toBe('ocid1.compartment.oc1..env');
  });

  it('should throw error if no compartment ID available', () => {
    const config: OCIOpenAIConfig = {};

    expect(() => getCompartmentId(config)).toThrow(
      'OCI compartment ID must be provided via config or OCI_COMPARTMENT_ID environment variable'
    );
  });
});
