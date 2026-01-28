import {
  SpeechModelV3,
  SpeechModelV3CallOptions,
} from "@ai-sdk/provider";
import { AIServiceSpeechClient } from "oci-aispeech";
import { createAuthProvider, getCompartmentId, getRegion } from "../auth";
import { getSpeechModelMetadata, isValidSpeechModelId } from "./registry";
import type { OCISpeechSettings } from "../types";

export class OCISpeechModel implements SpeechModelV3 {
  readonly specificationVersion = "v3";
  readonly provider = "oci-genai";

  private _client?: AIServiceSpeechClient;

  constructor(
    readonly modelId: string,
    private config: OCISpeechSettings
  ) {
    if (!isValidSpeechModelId(modelId)) {
      throw new Error(
        `Invalid speech model ID: ${modelId}. ` +
          `Valid models: oci.tts-1-hd, oci.tts-1`
      );
    }

    const region = getRegion(config);
    if (region !== "us-phoenix-1") {
      throw new Error(
        `OCI Speech is only available in us-phoenix-1 region. ` +
          `Current region: ${region}. Please set region to 'us-phoenix-1' in your config.`
      );
    }
  }

  private async getClient(): Promise<AIServiceSpeechClient> {
    if (!this._client) {
      const authProvider = await createAuthProvider(this.config);
      const region = getRegion(this.config);

      this._client = new AIServiceSpeechClient({
        authenticationDetailsProvider: authProvider,
      });

      this._client.region = region;

      if (this.config.endpoint) {
        this._client.endpoint = this.config.endpoint;
      }
    }

    return this._client;
  }

  async doGenerate(options: SpeechModelV3CallOptions): Promise<{
    audio: string | Uint8Array;
    warnings: Array<{ type: string; message: string }>;
    request?: { body?: unknown };
    response: {
      timestamp: Date;
      modelId: string;
      headers?: Record<string, string | string[]>;
      body?: unknown;
    };
    providerMetadata?: Record<string, any>;
  }> {
    const { text, voice, outputFormat, speed } = options;
    const metadata = getSpeechModelMetadata(this.modelId);

    if (text.length > metadata!.maxTextLength) {
      throw new Error(
        `Text length (${text.length}) exceeds maximum allowed (${metadata!.maxTextLength})`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);

    const selectedVoice =
      voice || this.config.voice || "en-US-Neural2-C";

    const selectedFormat =
      outputFormat || this.config.format || "mp3";

    if (!metadata!.supportedFormats.includes(selectedFormat as any)) {
      throw new Error(
        `Unsupported output format: ${selectedFormat}. ` +
          `Supported formats: ${metadata!.supportedFormats.join(", ")}`
      );
    }

    const request = {
      synthesizeSpeechDetails: {
        text,
        compartmentId,
        configuration: {
          modelDetails: {
            modelName: this.modelId,
            voiceId: selectedVoice,
          },
          audioConfig: {
            format: selectedFormat.toUpperCase(),
            sampleRateHz: selectedFormat === "pcm" ? 16000 : undefined,
          },
          speechSettings: {
            speechMarkTypes: [],
            ...(speed && { rate: speed.toString() }),
          },
        },
      },
    };

    const timestamp = new Date();

    const response = await client.synthesizeSpeech(request);

    const audioData = response.value as Uint8Array;

    return {
      audio: audioData,
      warnings: [],
      request: {
        body: request,
      },
      response: {
        timestamp,
        modelId: this.modelId,
        body: {
          format: selectedFormat,
          voice: selectedVoice,
        },
      },
      providerMetadata: {
        "oci-speech": {
          voice: selectedVoice,
          format: selectedFormat,
        },
      },
    };
  }
}
