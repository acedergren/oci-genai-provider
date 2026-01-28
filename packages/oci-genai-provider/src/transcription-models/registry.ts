export interface TranscriptionModelMetadata {
  id: string;
  name: string;
  family: 'oci-speech';
  modelType: 'standard' | 'whisper';
  maxLanguages: number;
  supportsCustomVocabulary: boolean;
  supportedFormats: string[];
  maxFileSizeMB: number;
}

export const TRANSCRIPTION_MODELS: TranscriptionModelMetadata[] = [
  {
    id: 'oci.speech.standard',
    name: 'OCI Speech Standard',
    family: 'oci-speech',
    modelType: 'standard',
    maxLanguages: 21,
    supportsCustomVocabulary: true,
    supportedFormats: ['wav', 'mp3', 'flac', 'ogg'],
    maxFileSizeMB: 2048,
  },
  {
    id: 'oci.speech.whisper',
    name: 'OCI Speech Whisper',
    family: 'oci-speech',
    modelType: 'whisper',
    maxLanguages: 99,
    supportsCustomVocabulary: false,
    supportedFormats: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'webm'],
    maxFileSizeMB: 2048,
  },
];

/**
 * Supported languages for OCI Speech
 * Standard model supports 21 languages
 * Whisper model supports 99+ languages
 */
export const SUPPORTED_LANGUAGES = [
  'en-US', // English (US)
  'en-GB', // English (UK)
  'en-AU', // English (Australia)
  'en-IN', // English (India)
  'es-ES', // Spanish (Spain)
  'es-MX', // Spanish (Mexico)
  'pt-BR', // Portuguese (Brazil)
  'pt-PT', // Portuguese (Portugal)
  'fr-FR', // French
  'de-DE', // German
  'it-IT', // Italian
  'ja-JP', // Japanese
  'ko-KR', // Korean
  'zh-CN', // Chinese (Simplified)
  'zh-TW', // Chinese (Traditional)
  'nl-NL', // Dutch
  'pl-PL', // Polish
  'ru-RU', // Russian
  'tr-TR', // Turkish
  'hi-IN', // Hindi
  'ar-SA', // Arabic
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isValidTranscriptionModelId(modelId: string): boolean {
  return TRANSCRIPTION_MODELS.some((m) => m.id === modelId);
}

export function getTranscriptionModelMetadata(
  modelId: string
): TranscriptionModelMetadata | undefined {
  return TRANSCRIPTION_MODELS.find((m) => m.id === modelId);
}

export function getAllTranscriptionModels(): TranscriptionModelMetadata[] {
  return TRANSCRIPTION_MODELS;
}

export function getSupportedLanguages(): readonly string[] {
  return SUPPORTED_LANGUAGES;
}
