import { describe, it, expect } from '@jest/globals';
import type {
  OCIConfig,
  OCIBaseConfig,
  OCILanguageModelSettings,
  OCIEmbeddingSettings,
  OCISpeechSettings,
  OCITranscriptionSettings,
  OCIRerankingSettings,
} from '../types';

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

// ============================================================================
// ProviderV3 Model-Specific Settings Tests
// ============================================================================

describe('OCIBaseConfig', () => {
  it('should accept all optional configuration fields', () => {
    const config: OCIBaseConfig = {
      region: 'eu-frankfurt-1',
      profile: 'FRANKFURT',
      auth: 'config_file',
      compartmentId: 'ocid1.compartment.oc1..test',
      endpoint: 'https://test.com',
      configPath: '/custom/path/config',
    };

    expect(config.region).toBe('eu-frankfurt-1');
    expect(config.auth).toBe('config_file');
  });

  it('should allow empty config', () => {
    const config: OCIBaseConfig = {};
    expect(config).toBeDefined();
  });
});

describe('OCILanguageModelSettings', () => {
  it('should extend OCIBaseConfig with requestOptions', () => {
    const settings: OCILanguageModelSettings = {
      region: 'eu-stockholm-1',
      requestOptions: {
        timeoutMs: 60000,
        retry: {
          enabled: true,
          maxRetries: 5,
        },
      },
    };

    expect(settings.region).toBe('eu-stockholm-1');
    expect(settings.requestOptions?.timeoutMs).toBe(60000);
  });
});

describe('OCIEmbeddingSettings', () => {
  it('should have embedding-specific options', () => {
    const settings: OCIEmbeddingSettings = {
      region: 'eu-frankfurt-1',
      dimensions: 1024,
      truncate: 'END',
      inputType: 'DOCUMENT',
    };

    expect(settings.dimensions).toBe(1024);
    expect(settings.truncate).toBe('END');
    expect(settings.inputType).toBe('DOCUMENT');
  });

  it('should accept 384 dimensions for light models', () => {
    const settings: OCIEmbeddingSettings = {
      dimensions: 384,
    };
    expect(settings.dimensions).toBe(384);
  });
});

describe('OCISpeechSettings', () => {
  it('should have TTS-specific options', () => {
    const settings: OCISpeechSettings = {
      voice: 'emma',
      speed: 1.5,
      format: 'mp3',
    };

    expect(settings.voice).toBe('emma');
    expect(settings.speed).toBe(1.5);
    expect(settings.format).toBe('mp3');
  });
});

describe('OCITranscriptionSettings', () => {
  it('should have STT-specific options', () => {
    const settings: OCITranscriptionSettings = {
      language: 'en',
      model: 'whisper',
      vocabulary: ['OCI', 'GenAI', 'Vercel'],
    };

    expect(settings.language).toBe('en');
    expect(settings.model).toBe('whisper');
    expect(settings.vocabulary).toContain('OCI');
  });
});

describe('OCIRerankingSettings', () => {
  it('should have reranking-specific options', () => {
    const settings: OCIRerankingSettings = {
      topN: 5,
      returnDocuments: true,
    };

    expect(settings.topN).toBe(5);
    expect(settings.returnDocuments).toBe(true);
  });
});
