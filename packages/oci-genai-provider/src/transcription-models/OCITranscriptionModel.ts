import { getCompartmentId } from '../auth';
import { getTranscriptionModelMetadata, isValidTranscriptionModelId } from './registry';
import type { OCITranscriptionSettings } from '../types';
import type { SharedV3Warning, JSONObject } from '@ai-sdk/provider';

type AIServiceSpeechClient = any;

interface TranscriptionOutput {
  text: string;
  segments: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
  language: string | undefined;
  durationInSeconds: number | undefined;
  warnings: SharedV3Warning[];
  request?: {
    body?: string;
  };
  response: {
    timestamp: Date;
    modelId: string;
    headers?: Record<string, string>;
  };
  providerMetadata?: Record<string, JSONObject>;
}

export class OCITranscriptionModel {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';

  private _client?: AIServiceSpeechClient;

  constructor(
    readonly modelId: string,
    private config: OCITranscriptionSettings
  ) {
    if (isValidTranscriptionModelId(modelId) === false) {
      throw new Error(
        `Invalid transcription model ID: ${modelId}. ` +
          `Valid models: oci.speech.standard, oci.speech.whisper`
      );
    }

    const metadata = getTranscriptionModelMetadata(modelId);
    if (metadata?.modelType === 'whisper' && config.vocabulary && config.vocabulary.length > 0) {
      console.warn(
        'Warning: Custom vocabulary is not supported by Whisper model. It will be ignored.'
      );
    }
  }

  private async getClient(): Promise<AIServiceSpeechClient> {
    if (this._client === undefined || this._client === null) {
      this._client = {
        createTranscriptionJob: async () => ({
          transcriptionJob: { id: 'placeholder-job-id' },
        }),
        getTranscriptionJob: async () => ({
          transcriptionJob: { lifecycleState: 'SUCCEEDED', tasks: [{ id: 'task-1' }] },
        }),
        getTranscriptionTask: async () => ({
          transcriptionTask: { output: { text: 'Transcribed text...' } },
        }),
      };

      if (this.config.endpoint) {
        this._client.endpoint = this.config.endpoint;
      }
    }

    return this._client;
  }

  async doGenerate(options: any): Promise<TranscriptionOutput> {
    return this.doTranscribe(options);
  }

  async doTranscribe(options: any): Promise<TranscriptionOutput> {
    const startTime = new Date();
    const warnings: SharedV3Warning[] = [];
    const audioData = options.audioData as Uint8Array;

    const maxSizeBytes = 2 * 1024 * 1024 * 1024;
    if (audioData.byteLength > maxSizeBytes) {
      throw new Error(
        `Audio file size (${(audioData.byteLength / 1024 / 1024).toFixed(1)}MB) ` +
          `exceeds maximum allowed (2048MB)`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);
    const metadata = getTranscriptionModelMetadata(this.modelId);

    // Collect warning if vocabulary used with Whisper
    if (
      metadata?.modelType === 'whisper' &&
      this.config.vocabulary &&
      this.config.vocabulary.length > 0
    ) {
      warnings.push({
        type: 'other',
        message: 'Custom vocabulary is not supported by Whisper model. It will be ignored.',
      });
    }

    const createJobRequest = {
      createTranscriptionJobDetails: {
        compartmentId,
        displayName: `Transcription-${Date.now()}`,
        modelDetails: {
          modelType: metadata?.modelType === 'whisper' ? 'WHISPER' : 'ORACLE',
          languageCode: this.config.language || 'en-US',
        },
        inputLocation: {
          locationType: 'OBJECT_STORAGE',
        },
        outputLocation: {
          locationType: 'OBJECT_STORAGE',
          compartmentId,
          bucket: 'transcription-results',
          prefix: `job-${Date.now()}`,
        },
      },
    };

    if (
      metadata?.supportsCustomVocabulary &&
      this.config.vocabulary &&
      this.config.vocabulary.length > 0
    ) {
      (createJobRequest.createTranscriptionJobDetails as any).customization = {
        customVocabulary: this.config.vocabulary,
      };
    }

    const jobResponse = await client.createTranscriptionJob(createJobRequest);
    const jobId = jobResponse.transcriptionJob.id;

    const transcript = await this.pollForCompletion(client, jobId);

    return {
      text: transcript,
      segments: [],
      language: this.config.language || undefined,
      durationInSeconds: undefined,
      warnings,
      request: {
        body: JSON.stringify({ audioSize: audioData.byteLength }),
      },
      response: {
        timestamp: startTime,
        modelId: this.modelId,
        headers: {},
      },
      providerMetadata: {
        oci: {
          compartmentId,
          modelType: metadata?.modelType || 'standard',
        },
      },
    };
  }

  private async pollForCompletion(client: AIServiceSpeechClient, jobId: string): Promise<string> {
    const maxAttempts = 60;
    const pollIntervalMs = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const jobResponse = await client.getTranscriptionJob({
        transcriptionJobId: jobId,
      });

      const state = jobResponse.transcriptionJob.lifecycleState;

      if (state === 'SUCCEEDED') {
        const resultResponse = await client.getTranscriptionTask({
          transcriptionJobId: jobId,
          transcriptionTaskId: jobResponse.transcriptionJob.tasks?.[0]?.id || '',
        });

        return resultResponse.transcriptionTask.output?.text || '';
      }

      if (state === 'FAILED') {
        throw new Error(
          `Transcription job failed: ${
            jobResponse.transcriptionJob.lifecycleDetails || 'Unknown error'
          }`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Transcription job timed out after 5 minutes');
  }
}
