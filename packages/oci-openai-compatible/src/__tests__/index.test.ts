import { describe, it, expect, afterEach } from '@jest/globals';
import { createOCIOpenAI, ociOpenAI } from '../index';
import type { OCIOpenAIConfig, OCIRegion, OCIModelId } from '../index';

describe('Package exports', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });
  it('should export createOCIOpenAI factory function', () => {
    expect(typeof createOCIOpenAI).toBe('function');
  });

  it('should export default ociOpenAI instance', () => {
    expect(ociOpenAI).toBeDefined();
    expect(ociOpenAI.chat).toBeDefined();
  });

  it('should export type definitions', () => {
    const config: OCIOpenAIConfig = {
      region: 'us-ashburn-1' as OCIRegion,
    };

    const modelId: OCIModelId = 'meta.llama-3.3-70b-instruct';

    expect(config.region).toBe('us-ashburn-1');
    expect(modelId).toBe('meta.llama-3.3-70b-instruct');
  });

  it('should create new client instance via factory', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';

    const client = createOCIOpenAI({
      region: 'eu-frankfurt-1',
    });

    expect(client).toBeDefined();
    expect(client).not.toBe(ociOpenAI);
  });
});
