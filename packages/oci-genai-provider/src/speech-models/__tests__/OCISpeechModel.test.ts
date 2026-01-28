import { describe, it, expect } from '@jest/globals';
import { OCISpeechModel } from '../OCISpeechModel';

describe('OCISpeechModel', () => {
  it('should have correct specification version and provider', () => {
    const model = new OCISpeechModel('oci.tts-1-hd', {
      compartmentId: 'ocid1.compartment.test',
      region: 'us-phoenix-1',
    });
    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('oci.tts-1-hd');
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCISpeechModel('invalid-model', {});
    }).toThrow('Invalid speech model ID');
  });

  it('should throw error if region is not us-phoenix-1', () => {
    expect(() => {
      new OCISpeechModel('oci.tts-1-hd', { region: 'eu-frankfurt-1' });
    }).toThrow('OCI Speech is only available in us-phoenix-1 region');
  });

  it('should allow us-phoenix-1 region', () => {
    expect(() => {
      new OCISpeechModel('oci.tts-1-hd', { region: 'us-phoenix-1' });
    }).not.toThrow();
  });

  it('should validate text length does not exceed max', async () => {
    const model = new OCISpeechModel('oci.tts-1-hd', {
      compartmentId: 'test',
      region: 'us-phoenix-1',
    });
    const longText = 'a'.repeat(5001);
    await expect(model.doGenerate({ text: longText })).rejects.toThrow(
      'Text length (5001) exceeds maximum allowed (5000)'
    );
  });

  describe('Voice Selection', () => {
    it('should use config.voice when provided (highest priority)', () => {
      const model = new OCISpeechModel('oci.tts-1-hd', {
        region: 'us-phoenix-1',
        voice: 'custom-voice-id',
      });
      expect(model.getVoice()).toBe('custom-voice-id');
    });

    it('should use metadata.defaultVoice when config.voice not provided', () => {
      // oci.tts-1-hd has defaultVoice: 'en-US-Neural2-A' in registry
      const model = new OCISpeechModel('oci.tts-1-hd', {
        region: 'us-phoenix-1',
      });
      expect(model.getVoice()).toBe('en-US-Neural2-A');
    });

    it('should fallback to hardcoded default when both config.voice and metadata.defaultVoice are undefined', () => {
      // oci.tts-1 has no defaultVoice in registry
      const model = new OCISpeechModel('oci.tts-1', {
        region: 'us-phoenix-1',
      });
      expect(model.getVoice()).toBe('en-US-AriaNeural');
    });

    it('should prefer config.voice over metadata.defaultVoice', () => {
      // oci.tts-1-hd has defaultVoice but config.voice should override it
      const model = new OCISpeechModel('oci.tts-1-hd', {
        region: 'us-phoenix-1',
        voice: 'my-custom-voice',
      });
      expect(model.getVoice()).toBe('my-custom-voice');
    });
  });

  describe('doGenerate', () => {
    it('should generate audio successfully for valid text', async () => {
      const model = new OCISpeechModel('oci.tts-1-hd', {
        region: 'us-phoenix-1',
      });
      const result = await model.doGenerate({ text: 'Hello world' });
      expect(result).toBeDefined();
      expect(result.audio).toBeInstanceOf(Uint8Array);
      expect(result.warnings).toEqual([]);
      expect(result.response.modelId).toBe('oci.tts-1-hd');
    });

    it('should return timestamp in response', async () => {
      const model = new OCISpeechModel('oci.tts-1-hd', {
        region: 'us-phoenix-1',
      });
      const before = new Date();
      const result = await model.doGenerate({ text: 'Test' });
      const after = new Date();
      expect(result.response.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.response.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
