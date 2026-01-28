import { RerankingModelV3, RerankingModelV3CallOptions } from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import { createAuthProvider, getCompartmentId, getRegion } from '../auth';
import { getRerankingModelMetadata, isValidRerankingModelId } from './registry';
import type { OCIRerankingSettings } from '../types';

export class OCIRerankingModel implements RerankingModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';

  private _client?: GenerativeAiInferenceClient;

  constructor(
    readonly modelId: string,
    private config: OCIRerankingSettings
  ) {
    if (!isValidRerankingModelId(modelId)) {
      throw new Error(`Invalid reranking model ID: ${modelId}. Valid models: cohere.rerank-v3.5`);
    }
  }

  private async getClient(): Promise<GenerativeAiInferenceClient> {
    if (!this._client) {
      const authProvider = await createAuthProvider(this.config);
      const region = getRegion(this.config);

      this._client = new GenerativeAiInferenceClient({
        authenticationDetailsProvider: authProvider,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this._client as any).region = region;

      if (this.config.endpoint) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._client as any).endpoint = this.config.endpoint;
      }
    }

    return this._client;
  }

  async doRerank(options: RerankingModelV3CallOptions): Promise<{
    ranking: Array<{
      index: number;
      relevanceScore: number;
    }>;
    response?: {
      id?: string;
      timestamp?: Date;
      modelId?: string;
    };
  }> {
    const { query, documents, topN } = options;

    if (documents.type !== 'text') {
      throw new Error(`OCI reranking only supports text documents, got: ${documents.type}`);
    }

    const documentTexts = documents.values;
    const metadata = getRerankingModelMetadata(this.modelId);

    if (metadata && documentTexts.length > metadata.maxDocuments) {
      throw new Error(
        `Document count (${documentTexts.length}) exceeds maximum allowed (${metadata.maxDocuments})`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (client as any).rerankText({
      rerankTextDetails: {
        servingMode: {
          servingType: 'ON_DEMAND',
          modelId: this.modelId,
        },
        compartmentId,
        input: query,
        documents: documentTexts,
        topN: topN ?? this.config.topN,
        isEcho: this.config.returnDocuments ?? false,
      },
    });

    const ranking = response.rerankTextResult.documentRanks.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rank: any) => ({
        index: rank.index ?? 0,
        relevanceScore: rank.relevanceScore ?? 0,
      })
    );

    return {
      ranking,
      response: {
        id: response.rerankTextResult.id,
        modelId: response.rerankTextResult.modelId,
      },
    };
  }
}
