import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCITranscriptionModel } from '../OCITranscriptionModel';

describe('OCITranscriptionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct specification version and provider', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      compartmentId: 'ocid1.compartment.test',
    });

    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('oci.speech.standard');
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCITranscriptionModel('invalid-model', {});
    }).toThrow('Invalid transcription model ID');
  });

  it('should accept language setting', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      language: 'en-US',
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
  });

  it('should accept custom vocabulary for standard model', () => {
    const model = new OCITranscriptionModel('oci.speech.standard', {
      vocabulary: ['OpenCode', 'GenAI', 'OCI'],
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
  });

  it('should warn about vocabulary for Whisper model', () => {
    // Whisper does not support custom vocabulary
    const model = new OCITranscriptionModel('oci.speech.whisper', {
      vocabulary: ['test'],
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
    // Note: Implementation should log warning, not throw
  });

  describe('audio validation', () => {
    it('should throw error when audio exceeds 2GB limit', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      // Create a small array but mock the byteLength to simulate 3GB
      const largeAudio = new Uint8Array(1);
      Object.defineProperty(largeAudio, 'byteLength', {
        value: 3 * 1024 * 1024 * 1024,
      });
      await expect(model.doGenerate({ audioData: largeAudio })).rejects.toThrow('Audio file size');
    });

    it('should accept audio under 2GB limit', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({
        audioData: new Uint8Array(1000),
      });
      expect(result.text).toBeDefined();
    });
  });

  describe('response structure', () => {
    it('should return all required TranscriptionOutput properties', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({ audioData: new Uint8Array(100) });

      expect(result.text).toBeDefined();
      expect(result.segments).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.response).toBeDefined();
      expect(result.response.timestamp).toBeInstanceOf(Date);
      expect(result.response.modelId).toBe('oci.speech.standard');
      expect('language' in result).toBe(true);
      expect('durationInSeconds' in result).toBe(true);
    });
  });

  describe('warnings', () => {
    it('should add warning when using vocabulary with Whisper model', async () => {
      const model = new OCITranscriptionModel('oci.speech.whisper', {
        compartmentId: 'test',
        vocabulary: ['custom', 'terms'],
      });
      const result = await model.doGenerate({ audioData: new Uint8Array(100) });
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('other');
    });

    it('should have empty warnings when vocabulary not used', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({ audioData: new Uint8Array(100) });
      expect(result.warnings).toEqual([]);
    });
  });

  describe('language handling', () => {
    it('should return configured language', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
        language: 'es-ES',
      });
      const result = await model.doGenerate({ audioData: new Uint8Array(100) });
      expect(result.language).toBe('es-ES');
    });

    it('should return undefined when language not configured', async () => {
      const model = new OCITranscriptionModel('oci.speech.standard', {
        compartmentId: 'test',
      });
      const result = await model.doGenerate({ audioData: new Uint8Array(100) });
      expect(result.language).toBeUndefined();
    });
  });
});
