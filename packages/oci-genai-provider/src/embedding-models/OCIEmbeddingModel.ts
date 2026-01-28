import {
  EmbeddingModelV3,
  EmbeddingModelV3CallOptions,
  EmbeddingModelV3Result,
} from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import { createAuthProvider, getCompartmentId, getRegion } from '../auth';
import { isValidEmbeddingModelId } from './registry';
import type { OCIEmbeddingSettings } from '../types';

export class OCIEmbeddingModel implements EmbeddingModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';
  readonly maxEmbeddingsPerCall = 96;
  readonly supportsParallelCalls = true;

  private _client?: GenerativeAiInferenceClient;

  constructor(
    readonly modelId: string,
    private config: OCIEmbeddingSettings
  ) {
    if (!isValidEmbeddingModelId(modelId)) {
      throw new Error(
        `Invalid embedding model ID: ${modelId}. ` +
          `Valid models: cohere.embed-multilingual-v3.0, cohere.embed-english-v3.0, cohere.embed-english-light-v3.0`
      );
    }
  }

  private async getClient(): Promise<GenerativeAiInferenceClient> {
    if (!this._client) {
      const authProvider = await createAuthProvider(this.config);
      const region = getRegion(this.config);

      this._client = new GenerativeAiInferenceClient({
        authenticationDetailsProvider: authProvider,
      });

      // Set region after client creation
      (this._client as any).region = region;

      if (this.config.endpoint) {
        (this._client as any).endpoint = this.config.endpoint;
      }
    }

    return this._client;
  }

  async doEmbed(
    options: EmbeddingModelV3CallOptions
  ): Promise<EmbeddingModelV3Result> {
    const { values } = options;

    // Validate batch size
    if (values.length > this.maxEmbeddingsPerCall) {
      throw new Error(
        `Batch size (${values.length}) exceeds maximum allowed (${this.maxEmbeddingsPerCall})`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);

    // Map truncate value to OCI API enum
    const truncateMap: Record<string, any> = {
      START: 'START',
      END: 'END',
      NONE: 'NONE',
    };

    // Map inputType to OCI API enum
    const inputTypeMap: Record<string, any> = {
      QUERY: 'QUERY',
      DOCUMENT: 'DOCUMENT',
    };

    // Build OCI request
    const request = {
      embedTextDetails: {
        servingMode: {
          servingType: 'ON_DEMAND',
          modelId: this.modelId,
        },
        compartmentId,
        inputs: values,
        truncate: truncateMap[this.config.truncate || 'END'],
        inputType: inputTypeMap[this.config.inputType || 'DOCUMENT'],
      },
    };

    // Call OCI API
    const response = await client.embedText(request);

    // Convert OCI response to AI SDK format
    const embeddings = response.embedTextResult.embeddings.map((emb: any) => emb);

    return {
      embeddings,
      usage: {
        tokens: values.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0),
      },
      warnings: [],
    };
  }
}
