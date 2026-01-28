import type { SharedV3Warning, SharedV2Headers } from '@ai-sdk/provider';
import { getRegion } from '../auth';
import { getSpeechModelMetadata, isValidSpeechModelId } from './registry';
import type { OCISpeechSettings } from '../types';
import type { SpeechModelV3, SpeechModelV3CallOptions } from '@ai-sdk/provider';

export class OCISpeechModel implements SpeechModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';
  private readonly voice: string;

  constructor(
    readonly modelId: string,
    config: OCISpeechSettings
  ) {
    if (!isValidSpeechModelId(modelId)) {
      throw new Error('Invalid speech model ID: ' + modelId);
    }
    const region = getRegion(config);
    if (region !== 'us-phoenix-1') {
      throw new Error(
        'OCI Speech is only available in us-phoenix-1 region. Current region: ' + region
      );
    }
    // Voice selection priority:
    // 1. config.voice (if provided)
    // 2. metadata.defaultVoice (from registry)
    // 3. Fallback to 'en-US-AriaNeural'
    const metadata = getSpeechModelMetadata(modelId);
    const defaultVoice = metadata?.defaultVoice;
    this.voice = config.voice ?? defaultVoice ?? 'en-US-AriaNeural';
  }

  getVoice(): string {
    return this.voice;
  }

  async doGenerate(options: SpeechModelV3CallOptions): Promise<{
    audio: string | Uint8Array;
    warnings: SharedV3Warning[];
    request?: { body?: unknown };
    response: { timestamp: Date; modelId: string; headers?: SharedV2Headers; body?: unknown };
    providerMetadata?: Record<string, any>;
  }> {
    const { text } = options;
    const metadata = getSpeechModelMetadata(this.modelId);
    if (!metadata) throw new Error('Invalid model metadata');
    if (text.length > metadata.maxTextLength) {
      throw new Error(
        'Text length (' + text.length + ') exceeds maximum allowed (' + metadata.maxTextLength + ')'
      );
    }
    return {
      audio: new Uint8Array(0),
      warnings: [],
      response: { timestamp: new Date(), modelId: this.modelId },
    };
  }
}
