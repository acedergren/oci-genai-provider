import { describe, it, expect } from '@jest/globals';
import { getBaseURL } from '../endpoint';
import type { OCIOpenAIConfig, OCIRegion } from '../types';

describe('getBaseURL', () => {
  it('should use custom endpoint if provided', () => {
    const config: OCIOpenAIConfig = {
      endpoint: 'https://custom.endpoint.com',
      region: 'us-ashburn-1',
    };

    const baseURL = getBaseURL(config);

    expect(baseURL).toBe('https://custom.endpoint.com/20231130/actions/v1');
  });

  it('should construct endpoint from region', () => {
    const config: OCIOpenAIConfig = {
      region: 'eu-frankfurt-1',
    };

    const baseURL = getBaseURL(config);

    expect(baseURL).toBe(
      'https://inference.generativeai.eu-frankfurt-1.oci.oraclecloud.com/20231130/actions/v1'
    );
  });

  it('should handle all supported regions', () => {
    const regions: Array<[string, string]> = [
      [
        'us-ashburn-1',
        'https://inference.generativeai.us-ashburn-1.oci.oraclecloud.com/20231130/actions/v1',
      ],
      [
        'us-chicago-1',
        'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/v1',
      ],
      [
        'us-phoenix-1',
        'https://inference.generativeai.us-phoenix-1.oci.oraclecloud.com/20231130/actions/v1',
      ],
      [
        'eu-frankfurt-1',
        'https://inference.generativeai.eu-frankfurt-1.oci.oraclecloud.com/20231130/actions/v1',
      ],
      [
        'ap-hyderabad-1',
        'https://inference.generativeai.ap-hyderabad-1.oci.oraclecloud.com/20231130/actions/v1',
      ],
      [
        'ap-osaka-1',
        'https://inference.generativeai.ap-osaka-1.oci.oraclecloud.com/20231130/actions/v1',
      ],
    ];

    regions.forEach(([region, expectedURL]) => {
      const config: OCIOpenAIConfig = { region: region as OCIRegion };
      expect(getBaseURL(config)).toBe(expectedURL);
    });
  });

  it('should use default region if none provided', () => {
    const config: OCIOpenAIConfig = {};

    const baseURL = getBaseURL(config);

    // Default region is us-ashburn-1
    expect(baseURL).toBe(
      'https://inference.generativeai.us-ashburn-1.oci.oraclecloud.com/20231130/actions/v1'
    );
  });

  it('should prefer custom endpoint over region', () => {
    const config: OCIOpenAIConfig = {
      endpoint: 'https://custom.com',
      region: 'eu-frankfurt-1',
    };

    const baseURL = getBaseURL(config);

    expect(baseURL).toBe('https://custom.com/20231130/actions/v1');
  });

  describe('endpoint validation', () => {
    it('should reject malformed URLs', () => {
      const config: OCIOpenAIConfig = { endpoint: 'not-a-url' };
      expect(() => getBaseURL(config)).toThrow('Invalid endpoint URL');
    });

    it('should reject HTTP endpoints (non-localhost)', () => {
      const config: OCIOpenAIConfig = { endpoint: 'http://example.com' };
      expect(() => getBaseURL(config)).toThrow('Endpoint must use HTTPS');
    });

    it('should allow HTTP for localhost', () => {
      const config: OCIOpenAIConfig = { endpoint: 'http://localhost:8080' };
      expect(() => getBaseURL(config)).not.toThrow();
    });

    it('should allow HTTP for 127.0.0.1', () => {
      const config: OCIOpenAIConfig = { endpoint: 'http://127.0.0.1:3000' };
      expect(() => getBaseURL(config)).not.toThrow();
    });

    it('should allow HTTPS endpoints', () => {
      const config: OCIOpenAIConfig = { endpoint: 'https://custom.endpoint.com' };
      expect(() => getBaseURL(config)).not.toThrow();
    });
  });
});
