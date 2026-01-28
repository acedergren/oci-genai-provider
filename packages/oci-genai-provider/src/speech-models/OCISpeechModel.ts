import { AIServiceSpeechClient, models } from 'oci-aispeech';
import { Region } from 'oci-common';
import type { SharedV3Warning, SharedV2Headers, JSONObject } from '@ai-sdk/provider';
import { createAuthProvider, getRegion, getCompartmentId } from '../auth';
import { getSpeechModelMetadata, isValidSpeechModelId } from './registry';
import type { OCISpeechSettings } from '../types';
import type { SpeechModelV3, SpeechModelV3CallOptions } from '@ai-sdk/provider';

export class OCISpeechModel implements SpeechModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';
  private readonly voice: string;
  private readonly _config: OCISpeechSettings;
  private _client?: AIServiceSpeechClient;

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
    this._config = config;
  }

  private async getClient(): Promise<AIServiceSpeechClient> {
    if (!this._client) {
      const authProvider = await createAuthProvider(this._config);
      const region = getRegion(this._config);

      this._client = new AIServiceSpeechClient({
        authenticationDetailsProvider: authProvider,
      });

      this._client.region = Region.fromRegionId(region);

      if (this._config.endpoint) {
        this._client.endpoint = this._config.endpoint;
      }
    }

    return this._client;
  }

  getVoice(): string {
    return this.voice;
  }

  async doGenerate(options: SpeechModelV3CallOptions): Promise<{
    audio: string | Uint8Array;
    warnings: SharedV3Warning[];
    request?: { body?: unknown };
    response: { timestamp: Date; modelId: string; headers?: SharedV2Headers; body?: unknown };
    providerMetadata?: Record<string, JSONObject>;
  }> {
    const startTime = new Date();
    const { text } = options;

    const metadata = getSpeechModelMetadata(this.modelId);
    if (!metadata) throw new Error('Invalid model metadata');

    if (text.length > metadata.maxTextLength) {
      throw new Error(
        'Text length (' + text.length + ') exceeds maximum allowed (' + metadata.maxTextLength + ')'
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this._config);

    // Map format to OCI output format enum
    const outputFormat = this.mapOutputFormat(this._config.format);

    // Build synthesize speech request using proper OCI SDK types
    const synthesizeSpeechDetails: models.SynthesizeSpeechDetails = {
      text,
      isStreamEnabled: false,
      compartmentId,
      configuration: {
        modelFamily: 'ORACLE',
        modelDetails: {
          modelName: 'TTS_2_NATURAL',
          voiceId: this.voice,
        },
        speechSettings: {
          outputFormat,
        },
      },
    };

    const response = await client.synthesizeSpeech({
      synthesizeSpeechDetails,
    });

    // Convert response stream to Uint8Array
    const audioData = await this.streamToUint8Array(response.value as NodeJS.ReadableStream);

    return {
      audio: audioData,
      warnings: [],
      request: {
        body: synthesizeSpeechDetails,
      },
      response: {
        timestamp: startTime,
        modelId: this.modelId,
        headers: {},
      },
      providerMetadata: {
        oci: {
          compartmentId,
          voice: this.voice,
          format: this._config.format || 'mp3',
        },
      },
    };
  }

  /**
   * Map user-friendly format names to OCI OutputFormat enum
   */
  private mapOutputFormat(format?: string): models.TtsOracleSpeechSettings.OutputFormat {
    switch (format) {
      case 'wav':
      case 'pcm':
        return models.TtsOracleSpeechSettings.OutputFormat.Pcm;
      case 'ogg':
        return models.TtsOracleSpeechSettings.OutputFormat.Ogg;
      case 'mp3':
      default:
        return models.TtsOracleSpeechSettings.OutputFormat.Mp3;
    }
  }

  /**
   * Convert a Node.js readable stream to Uint8Array
   */
  private async streamToUint8Array(stream: NodeJS.ReadableStream): Promise<Uint8Array> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(new Uint8Array(buffer));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }
}
