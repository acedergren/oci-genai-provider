import { describe, it, expect } from '@jest/globals';
import {
  getTranscriptionModelMetadata,
  isValidTranscriptionModelId,
  getAllTranscriptionModels,
  getSupportedLanguages,
} from '../registry';

describe('Transcription Model Registry', () => {
  it('should validate transcription model IDs', () => {
    expect(isValidTranscriptionModelId('oci.speech.standard')).toBe(true);
    expect(isValidTranscriptionModelId('oci.speech.whisper')).toBe(true);
    expect(isValidTranscriptionModelId('invalid-model')).toBe(false);
  });

  it('should return metadata for valid transcription models', () => {
    const metadata = getTranscriptionModelMetadata('oci.speech.standard');

    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('oci.speech.standard');
    expect(metadata?.name).toBe('OCI Speech Standard');
    expect(metadata?.family).toBe('oci-speech');
  });

  it('should return undefined for invalid model IDs', () => {
    const metadata = getTranscriptionModelMetadata('invalid-model');
    expect(metadata).toBeUndefined();
  });

  it('should list all transcription models', () => {
    const models = getAllTranscriptionModels();

    expect(models.length).toBe(2);
    expect(models.some((m) => m.id === 'oci.speech.standard')).toBe(true);
    expect(models.some((m) => m.id === 'oci.speech.whisper')).toBe(true);
  });

  it('should return supported languages', () => {
    const languages = getSupportedLanguages();

    expect(languages).toContain('en-US');
    expect(languages).toContain('es-ES');
    expect(languages).toContain('de-DE');
    expect(languages.length).toBeGreaterThan(10);
  });

  it('should indicate Whisper supports more languages', () => {
    const standard = getTranscriptionModelMetadata('oci.speech.standard');
    const whisper = getTranscriptionModelMetadata('oci.speech.whisper');

    expect(standard?.maxLanguages).toBeLessThan(whisper?.maxLanguages || 0);
  });
});
