export interface SpeechModelMetadata {
  id: string;
  name: string;
  family: 'oci-speech';
  supportedFormats: ('mp3' | 'ogg' | 'pcm')[];
  supportedVoices: string[];
  maxTextLength: number;
  requiredRegion: 'us-phoenix-1';
  defaultVoice?: string;
}

export const OCI_TTS_VOICES = [
  'en-US-Neural2-A',
  'en-US-Neural2-C',
  'en-US-Neural2-D',
  'en-US-Neural2-E',
  'en-US-Neural2-F',
  'en-US-Neural2-G',
  'en-US-Neural2-H',
  'en-US-Neural2-I',
  'en-US-Neural2-J',
] as const;

export const SPEECH_MODELS: SpeechModelMetadata[] = [
  {
    id: 'oci.tts-1-hd',
    name: 'OCI TTS High Definition',
    family: 'oci-speech',
    supportedFormats: ['mp3', 'ogg', 'pcm'],
    supportedVoices: [...OCI_TTS_VOICES],
    maxTextLength: 5000,
    requiredRegion: 'us-phoenix-1',
    defaultVoice: 'en-US-Neural2-A',
  },
  {
    id: 'oci.tts-1',
    name: 'OCI TTS Standard',
    family: 'oci-speech',
    supportedFormats: ['mp3', 'ogg', 'pcm'],
    supportedVoices: [...OCI_TTS_VOICES],
    maxTextLength: 5000,
    requiredRegion: 'us-phoenix-1',
    // No defaultVoice - tests hardcoded fallback
  },
];

export function isValidSpeechModelId(modelId: string): boolean {
  return SPEECH_MODELS.some((m) => m.id === modelId);
}

export function getSpeechModelMetadata(modelId: string): SpeechModelMetadata | undefined {
  return SPEECH_MODELS.find((m) => m.id === modelId);
}

export function getAllSpeechModels(): SpeechModelMetadata[] {
  return SPEECH_MODELS;
}

export function getAllVoices(): string[] {
  return [...OCI_TTS_VOICES];
}
