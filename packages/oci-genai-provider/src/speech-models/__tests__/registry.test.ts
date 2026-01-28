import { describe, it, expect } from '@jest/globals';
import {
  getSpeechModelMetadata,
  isValidSpeechModelId,
  getAllSpeechModels,
  getAllVoices,
} from '../registry';

describe('Speech Model Registry', () => {
  it('should validate OCI TTS model IDs', () => {
    expect(isValidSpeechModelId('oci.tts-1-hd')).toBe(true);
    expect(isValidSpeechModelId('oci.tts-1')).toBe(true);
    expect(isValidSpeechModelId('invalid-model')).toBe(false);
  });

  it('should return metadata for valid speech models', () => {
    const metadata = getSpeechModelMetadata('oci.tts-1-hd');

    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('oci.tts-1-hd');
    expect(metadata?.family).toBe('oci-speech');
    expect(metadata?.supportedFormats).toContain('mp3');
  });

  it('should return undefined for invalid model IDs', () => {
    const metadata = getSpeechModelMetadata('invalid-model');
    expect(metadata).toBeUndefined();
  });

  it('should list all speech models', () => {
    const models = getAllSpeechModels();

    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.family === 'oci-speech')).toBe(true);
  });

  it('should list all available voices', () => {
    const voices = getAllVoices();

    expect(voices.length).toBeGreaterThan(0);
    expect(voices).toContain('en-US-Neural2-A');
    expect(voices).toContain('en-US-Neural2-C');
  });

  it('should indicate Phoenix region requirement', () => {
    const metadata = getSpeechModelMetadata('oci.tts-1-hd');

    expect(metadata?.requiredRegion).toBe('us-phoenix-1');
  });
});
