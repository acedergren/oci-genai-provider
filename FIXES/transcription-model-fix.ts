/**
 * FIX #1: TranscriptionModelV3 Type Compatibility
 *
 * File: packages/oci-genai-provider/src/transcription-models/OCITranscriptionModel.ts
 *
 * PROBLEM: Missing required properties in TranscriptionOutput interface
 * IMPACT: TypeScript compilation error, provider cannot be used
 *
 * REQUIRED CHANGES:
 */

import { SharedV3Warning } from '@ai-sdk/provider';
import { getCompartmentId } from "../auth";
import {
  getTranscriptionModelMetadata,
  isValidTranscriptionModelId,
} from "./registry";
import type { OCITranscriptionSettings } from "../types";
import { AIServiceSpeechClient } from 'oci-aispeech';
import { Region } from 'oci-common';
import { createAuthProvider, getRegion } from '../auth';

// ✅ CORRECT TranscriptionOutput interface matching AI SDK v3
interface TranscriptionOutput {
  text: string;
  segments: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
  language: string | undefined;
  durationInSeconds: number | undefined;  // ADDED
  warnings: SharedV3Warning[];             // ADDED
  request?: {                              // ADDED (optional)
    body?: string;
  };
  response: {                              // ADDED (required)
    timestamp: Date;
    modelId: string;
    headers?: Record<string, string>;
  };
  providerMetadata?: Record<string, unknown>;  // ADDED (optional)
}

export class OCITranscriptionModel {
  readonly specificationVersion = "v3";
  readonly provider = "oci-genai";

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
    if (
      metadata?.modelType === "whisper" &&
      config.vocabulary &&
      config.vocabulary.length > 0
    ) {
      console.warn(
        "Warning: Custom vocabulary is not supported by Whisper model. It will be ignored."
      );
    }
  }

  // ✅ FIX: Use real OCI Speech SDK client
  private async getClient(): Promise<AIServiceSpeechClient> {
    if (!this._client) {
      const authProvider = await createAuthProvider(this.config);
      const region = getRegion(this.config);

      this._client = new AIServiceSpeechClient({
        authenticationDetailsProvider: authProvider,
      });

      // Set region
      this._client.region = Region.fromRegionId(region);

      if (this.config.endpoint) {
        this._client.endpoint = this.config.endpoint;
      }
    }

    return this._client;
  }

  async doGenerate(options: any): Promise<TranscriptionOutput> {
    return this.doTranscribe(options);
  }

  // ✅ FIX: Return complete TranscriptionOutput with all required properties
  async doTranscribe(options: any): Promise<TranscriptionOutput> {
    const startTime = new Date();
    const audioData = options.audioData as Uint8Array;

    // Validation
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

    const createJobRequest = {
      createTranscriptionJobDetails: {
        compartmentId,
        displayName: `Transcription-${Date.now()}`,
        modelDetails: {
          modelType: metadata?.modelType === "whisper" ? "WHISPER" : "ORACLE",
          languageCode: this.config.language || "en-US",
        },
        inputLocation: {
          locationType: "OBJECT_STORAGE",
          // TODO: Upload audioData to object storage
          // For now, this is a placeholder
          bucketName: "transcription-input",
          objectName: `audio-${Date.now()}.wav`,
        },
        outputLocation: {
          locationType: "OBJECT_STORAGE",
          compartmentId,
          bucketName: "transcription-results",
        },
      },
    };

    // Create transcription job
    const jobResponse = await client.createTranscriptionJob(createJobRequest);
    const jobId = jobResponse.transcriptionJob.id;

    // Poll for completion (simplified - production should use exponential backoff)
    let job = jobResponse.transcriptionJob;
    while (job.lifecycleState !== "SUCCEEDED" && job.lifecycleState !== "FAILED") {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      const statusResponse = await client.getTranscriptionJob({ transcriptionJobId: jobId });
      job = statusResponse.transcriptionJob;
    }

    if (job.lifecycleState === "FAILED") {
      throw new Error(`Transcription job failed: ${job.lifecycleDetails || "Unknown error"}`);
    }

    // Get transcription results
    const taskId = job.tasks?.[0]?.id;
    if (!taskId) {
      throw new Error("No transcription task found in job");
    }

    const taskResponse = await client.getTranscriptionTask({ transcriptionTaskId: taskId });
    const transcription = taskResponse.transcriptionTask;

    // Parse segments
    const segments = (transcription.output?.segments || []).map((seg: any) => ({
      text: seg.text || "",
      startSecond: seg.startTime || 0,
      endSecond: seg.endTime || 0,
    }));

    const fullText = segments.map(s => s.text).join(" ");
    const detectedLanguage = transcription.language || this.config.language || undefined;
    const duration = transcription.durationInSeconds || undefined;

    // ✅ Collect warnings
    const warnings: SharedV3Warning[] = [];
    if (metadata?.modelType === "whisper" && this.config.vocabulary?.length) {
      warnings.push({
        type: 'unsupported-setting',
        setting: 'vocabulary',
        message: 'Custom vocabulary is not supported by Whisper model',
      });
    }

    // ✅ Return complete response matching AI SDK v3 interface
    return {
      text: fullText,
      segments,
      language: detectedLanguage,
      durationInSeconds: duration,
      warnings,
      request: {
        body: JSON.stringify(createJobRequest),
      },
      response: {
        timestamp: startTime,
        modelId: this.modelId,
        headers: {},
      },
      providerMetadata: {
        jobId: jobId,
        taskId: taskId,
        lifecycleState: job.lifecycleState,
      },
    };
  }
}

/**
 * TESTING REQUIREMENTS:
 *
 * 1. Test successful transcription flow
 * 2. Test audio size validation
 * 3. Test job failure handling
 * 4. Test Whisper vs standard model paths
 * 5. Test language detection
 * 6. Test segment parsing
 * 7. Test vocabulary warning for Whisper
 * 8. Mock OCI Speech SDK properly
 */
