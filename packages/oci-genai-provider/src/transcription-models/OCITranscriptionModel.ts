import { getCompartmentId } from "../auth";
import {
  getTranscriptionModelMetadata,
  isValidTranscriptionModelId,
} from "./registry";
import type { OCITranscriptionSettings } from "../types";

// Type placeholder for AIServiceSpeechClient since oci-aispeech may not be installed yet
type AIServiceSpeechClient = any;

// Placeholder interface for TranscriptionModelV3CallOptions
interface TranscriptionModelV3CallOptions {
  audioData: Uint8Array;
  [key: string]: any;
}

// Placeholder interface for TranscriptionModelV3CallOutput
interface TranscriptionModelV3CallOutput {
  text: string;
  segments: Array<any>;
  language: string;
}

// Placeholder interface for TranscriptionModelV3
interface TranscriptionModelV3 {
  specificationVersion: string;
  provider: string;
  modelId: string;
  doTranscribe(
    options: TranscriptionModelV3CallOptions
  ): Promise<TranscriptionModelV3CallOutput>;
}

export class OCITranscriptionModel implements TranscriptionModelV3 {
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

    // Warn if using vocabulary with Whisper (not supported)
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

  private async getClient(): Promise<AIServiceSpeechClient> {
    if (this._client === undefined || this._client === null) {
      
      

      // Note: oci-aispeech will be initialized when SDK is installed
      // For now this is a placeholder that will be implemented when SDK is available
      this._client = {
        createTranscriptionJob: async () => ({
          transcriptionJob: { id: "placeholder-job-id" },
        }),
        getTranscriptionJob: async () => ({
          transcriptionJob: { lifecycleState: "SUCCEEDED", tasks: [{ id: "task-1" }] },
        }),
        getTranscriptionTask: async () => ({
          transcriptionTask: { output: { text: "Transcribed text..." } },
        }),
      };

      if (this.config.endpoint) {
        (this._client as any).endpoint = this.config.endpoint;
      }
    }

    return this._client;
  }

  async doTranscribe(
    options: TranscriptionModelV3CallOptions
  ): Promise<TranscriptionModelV3CallOutput> {
    const { audioData } = options;

    // Validate file size (2GB max)
    const maxSizeBytes = 2 * 1024 * 1024 * 1024; // 2GB
    if (audioData.byteLength > maxSizeBytes) {
      throw new Error(
        `Audio file size (${(audioData.byteLength / 1024 / 1024).toFixed(1)}MB) ` +
          `exceeds maximum allowed (2048MB)`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);
    const metadata = getTranscriptionModelMetadata(this.modelId);

    // Step 1: Create transcription job
    const createJobRequest = {
      createTranscriptionJobDetails: {
        compartmentId,
        displayName: `Transcription-${Date.now()}`,
        modelDetails: {
          modelType: metadata?.modelType === "whisper" ? "WHISPER" : "ORACLE",
          languageCode: this.config.language || "en-US",
        },
        inputLocation: {
          locationType: "OBJECT_STORAGE", // Will upload to OCI Object Storage
        },
        outputLocation: {
          locationType: "OBJECT_STORAGE",
          compartmentId,
          bucket: "transcription-results",
          prefix: `job-${Date.now()}`,
        },
      },
    };

    // Add custom vocabulary if supported and provided
    if (
      metadata?.supportsCustomVocabulary &&
      this.config.vocabulary &&
      this.config.vocabulary.length > 0
    ) {
      (createJobRequest.createTranscriptionJobDetails as any).customization = {
        customVocabulary: this.config.vocabulary,
      };
    }

    // Create job
    const jobResponse = await client.createTranscriptionJob(createJobRequest);
    const jobId = jobResponse.transcriptionJob.id;

    // Step 2: Poll for completion
    const transcript = await this.pollForCompletion(client, jobId);

    return {
      text: transcript,
      segments: [], // OCI does not provide segments in basic response
      language: this.config.language || "en-US",
    };
  }

  /**
   * Poll transcription job until complete
   */
  private async pollForCompletion(
    client: AIServiceSpeechClient,
    jobId: string
  ): Promise<string> {
    const maxAttempts = 60; // 5 minutes max
    const pollIntervalMs = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const jobResponse = await client.getTranscriptionJob({
        transcriptionJobId: jobId,
      });

      const state = jobResponse.transcriptionJob.lifecycleState;

      if (state === "SUCCEEDED") {
        // Fetch transcription result
        const resultResponse = await client.getTranscriptionTask({
          transcriptionJobId: jobId,
          transcriptionTaskId: jobResponse.transcriptionJob.tasks?.[0]?.id || "",
        });

        return resultResponse.transcriptionTask.output?.text || "";
      }

      if (state === "FAILED") {
        throw new Error(
          `Transcription job failed: ${
            jobResponse.transcriptionJob.lifecycleDetails || "Unknown error"
          }`
        );
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Transcription job timed out after 5 minutes");
  }
}
