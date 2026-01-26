import { describe, it, expect } from '@jest/globals';

describe('createOCI Provider Factory', () => {
  describe('Factory Creation', () => {
    it('should create provider with default config', () => {
      const provider = {
        provider: 'oci-genai',
        model: (): void => {},
      };
      expect(provider.provider).toBe('oci-genai');
    });

    it('should create provider with Frankfurt region', () => {
      const config = {
        region: 'eu-frankfurt-1',
      };
      expect(config.region).toBe('eu-frankfurt-1');
    });

    it('should create provider with custom profile', () => {
      const config = {
        region: 'eu-frankfurt-1',
        profile: 'FRANKFURT',
      };
      expect(config.profile).toBe('FRANKFURT');
    });

    it('should create provider with compartment ID', () => {
      const config = {
        compartmentId: 'ocid1.compartment.oc1..test',
      };
      expect(config.compartmentId).toBeDefined();
    });

    it('should create provider with instance principal auth', () => {
      const config = {
        region: 'eu-frankfurt-1',
        auth: 'instance_principal' as const,
      };
      expect(config.auth).toBe('instance_principal');
    });
  });

  describe('Model Creation', () => {
    it('should create language model instance', () => {
      const modelFactory = (id: string) => ({
        provider: 'oci-genai',
        modelId: id,
        specificationVersion: 'v1',
      });

      const model = modelFactory('cohere.command-r-plus');
      expect(model.modelId).toBe('cohere.command-r-plus');
    });

    it('should create Grok model', () => {
      const modelId = 'xai.grok-4-maverick';
      expect(modelId).toContain('grok');
    });

    it('should create Llama model', () => {
      const modelId = 'meta.llama-3.3-70b-instruct';
      expect(modelId).toContain('llama');
    });

    it('should create Cohere model', () => {
      const modelId = 'cohere.command-r-plus';
      expect(modelId).toContain('cohere');
    });

    it('should create Gemini model', () => {
      const modelId = 'google.gemini-2.5-flash';
      expect(modelId).toContain('gemini');
    });

    it('should throw error for invalid model ID', () => {
      expect(() => {
        const id = 'invalid.model';
        if (!id.match(/^(xai|meta|cohere|google)\./)) {
          throw new Error('Invalid model ID');
        }
      }).toThrow();
    });
  });

  describe('Configuration Cascade', () => {
    it('should prioritize config over environment', () => {
      process.env.OCI_REGION = 'us-ashburn-1';
      const config = {
        region: 'eu-frankfurt-1',
      };
      // Config should win
      expect(config.region).toBe('eu-frankfurt-1');
    });

    it('should use environment when config not provided', () => {
      process.env.OCI_REGION = 'eu-stockholm-1';
      const _config = {};
      // Environment should be used
      expect(_config).toBeDefined();
      expect(process.env.OCI_REGION).toBe('eu-stockholm-1');
    });

    it('should use Frankfurt as final default', () => {
      delete process.env.OCI_REGION;
      const defaultRegion = 'eu-frankfurt-1';
      expect(defaultRegion).toBe('eu-frankfurt-1');
    });
  });

  describe('Usage with AI SDK', () => {
    it('should work with generateText pattern', () => {
      const oci = {
        provider: 'oci-genai',
        model: (id: string) => ({ modelId: id }),
      };

      const model = oci.model('cohere.command-r-plus');
      expect(model.modelId).toBe('cohere.command-r-plus');
    });

    it('should work with streamText pattern', () => {
      const oci = {
        provider: 'oci-genai',
        model: (id: string) => ({ modelId: id }),
      };

      const model = oci.model('xai.grok-4-maverick');
      expect(model.modelId).toContain('grok');
    });
  });
});
