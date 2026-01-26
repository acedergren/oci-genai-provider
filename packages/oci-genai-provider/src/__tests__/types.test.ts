import { describe, it, expect } from '@jest/globals';
import type { OCIConfig, OCIProvider } from '../types';

describe('OCIConfig', () => {
  it('should allow optional region configuration', () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
    };
    expect(config.region).toBe('eu-frankfurt-1');
  });

  it('should allow all authentication methods', () => {
    const configWithProfile: OCIConfig = {
      region: 'eu-frankfurt-1',
      profile: 'FRANKFURT',
    };

    const configWithAuth: OCIConfig = {
      region: 'eu-frankfurt-1',
      auth: 'instance_principal',
    };

    expect(configWithProfile.profile).toBe('FRANKFURT');
    expect(configWithAuth.auth).toBe('instance_principal');
  });
});

describe('OCIProvider', () => {
  it('should have provider and model factory', () => {
    /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
    const mockModel = (_modelId: string): any => ({});
    /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
    const provider: OCIProvider = {
      provider: 'oci-genai',
      model: mockModel,
    };

    expect(provider.provider).toBe('oci-genai');
    expect(typeof provider.model).toBe('function');
  });
});
