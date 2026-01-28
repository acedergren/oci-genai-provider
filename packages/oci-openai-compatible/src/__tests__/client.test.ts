import { describe, it, expect } from '@jest/globals';
import { createOCIOpenAI } from '../client';
import type { OCIOpenAIConfig } from '../types';

describe('createOCIOpenAI', () => {
  it('should create OpenAI client with OCI configuration', () => {
    const config: OCIOpenAIConfig = {
      region: 'us-ashburn-1',
      apiKey: 'test-key',
      compartmentId: 'ocid1.compartment.oc1..test',
    };

    const client = createOCIOpenAI(config);

    expect(client).toBeDefined();
    expect(client.chat).toBeDefined();
    expect(client.chat.completions).toBeDefined();
  });

  it('should create client with default config', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..env';

    const client = createOCIOpenAI();

    expect(client).toBeDefined();
  });

  it('should create client with custom endpoint', () => {
    const config: OCIOpenAIConfig = {
      endpoint: 'https://custom.endpoint.com',
      compartmentId: 'ocid1.compartment.oc1..test',
    };

    const client = createOCIOpenAI(config);

    expect(client).toBeDefined();
  });

  it('should throw error if compartment ID missing', () => {
    delete process.env.OCI_COMPARTMENT_ID;

    const config: OCIOpenAIConfig = {
      region: 'us-ashburn-1',
    };

    expect(() => createOCIOpenAI(config)).toThrow(
      'OCI compartment ID must be provided'
    );
  });
});
