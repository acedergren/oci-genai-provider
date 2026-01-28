import { describe, it, expect } from '@jest/globals';
import type { OCIOpenAIConfig, OCIRegion } from '../types';

describe('OCIOpenAIConfig', () => {
  it('should accept minimal config with region only', () => {
    const config: OCIOpenAIConfig = {
      region: 'us-ashburn-1',
    };

    expect(config.region).toBe('us-ashburn-1');
  });

  it('should accept full config with all optional fields', () => {
    const config: OCIOpenAIConfig = {
      region: 'eu-frankfurt-1',
      apiKey: 'test-key',
      compartmentId: 'ocid1.compartment.oc1..test',
      endpoint: 'https://custom.endpoint.com',
      auth: 'api_key',
    };

    expect(config.region).toBe('eu-frankfurt-1');
    expect(config.apiKey).toBe('test-key');
    expect(config.compartmentId).toBe('ocid1.compartment.oc1..test');
    expect(config.endpoint).toBe('https://custom.endpoint.com');
    expect(config.auth).toBe('api_key');
  });

  it('should allow empty config object', () => {
    const config: OCIOpenAIConfig = {};
    expect(config).toBeDefined();
  });
});

describe('OCIRegion type', () => {
  it('should accept supported OpenAI-compatible regions', () => {
    const regions: OCIRegion[] = [
      'us-ashburn-1',
      'us-chicago-1',
      'us-phoenix-1',
      'eu-frankfurt-1',
      'ap-hyderabad-1',
      'ap-osaka-1',
    ];

    expect(regions).toHaveLength(6);
  });
});
