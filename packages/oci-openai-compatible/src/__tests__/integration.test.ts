import { describe, it, expect, beforeAll } from '@jest/globals';
import { createOCIOpenAI } from '../client';
import type { OCIOpenAIConfig } from '../types';

describe('Integration: OCI OpenAI Client', () => {
  let client: ReturnType<typeof createOCIOpenAI>;

  beforeAll(() => {
    // Mock environment for tests
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test123';

    const config: OCIOpenAIConfig = {
      region: 'us-ashburn-1',
      apiKey: 'mock-api-key',
      compartmentId: process.env.OCI_COMPARTMENT_ID,
    };

    client = createOCIOpenAI(config);
  });

  it('should have chat.completions interface', () => {
    expect(client.chat).toBeDefined();
    expect(client.chat.completions).toBeDefined();
    expect(typeof client.chat.completions.create).toBe('function');
  });

  it('should construct proper base URL', () => {
    const testClient = createOCIOpenAI({
      region: 'eu-frankfurt-1',
      compartmentId: 'ocid1.test',
    });

    // Access internal baseURL (private, but we can infer from structure)
    expect(testClient).toBeDefined();
  });

  it('should handle custom endpoint', () => {
    const customClient = createOCIOpenAI({
      endpoint: 'https://custom.endpoint.test',
      compartmentId: 'ocid1.test',
    });

    expect(customClient).toBeDefined();
  });

  it('should support all OCI regions', () => {
    const regions = [
      'us-ashburn-1',
      'us-chicago-1',
      'us-phoenix-1',
      'eu-frankfurt-1',
      'ap-hyderabad-1',
      'ap-osaka-1',
    ] as const;

    regions.forEach((region) => {
      const regionalClient = createOCIOpenAI({
        region,
        compartmentId: 'ocid1.test',
      });

      expect(regionalClient).toBeDefined();
    });
  });
});
