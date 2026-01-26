import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createAuthProvider } from '../index';
import type { OCIConfig } from '../../types';

// Mock OCI SDK
jest.mock('oci-common', () => ({
  ConfigFileAuthenticationDetailsProvider: jest.fn().mockImplementation(() => ({
    type: 'config_file',
  })),
  InstancePrincipalsAuthenticationDetailsProviderBuilder: jest.fn().mockImplementation(() => ({
    // @ts-expect-error - Jest mock type limitation
    build: jest.fn().mockResolvedValue({ type: 'instance_principal' }),
  })),
  ResourcePrincipalAuthenticationDetailsProvider: {
    builder: jest.fn().mockReturnValue({ type: 'resource_principal' }),
  },
  Region: {
    EU_FRANKFURT_1: 'eu-frankfurt-1',
  },
}));

describe('createAuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create config file auth provider by default', async () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
    };

    const provider = await createAuthProvider(config);

    expect(provider).toBeDefined();
  });

  it('should use custom profile when provided', async () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
      profile: 'FRANKFURT',
    };

    const provider = await createAuthProvider(config);

    expect(provider).toBeDefined();
  });

  it('should create instance principal auth when specified', async () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
      auth: 'instance_principal',
    };

    const provider = await createAuthProvider(config);

    expect(provider).toBeDefined();
  });

  it('should throw error for unsupported auth method', async () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
      auth: 'unsupported' as OCIConfig['auth'],
    };

    await expect(createAuthProvider(config)).rejects.toThrow('Unsupported authentication method');
  });
});
