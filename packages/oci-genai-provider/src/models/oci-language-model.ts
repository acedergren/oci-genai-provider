import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3FinishReason,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
  LanguageModelV3StreamResult,
} from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import { Region } from 'oci-common';
import type { OCIConfig } from '../types';
import { isValidModelId } from './registry';
import { convertToOCIMessages } from '../converters/messages';
import { mapFinishReason, parseSSEStream } from '../streaming/sse-parser';
import { createAuthProvider, getRegion } from '../auth/index.js';

interface OCIChatChoice {
  message?: {
    content?: Array<{ text?: string }>;
  };
  finishReason?: string;
}

interface OCIChatResponse {
  chatResponse?: {
    chatChoice?: OCIChatChoice[];
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
    };
  };
}

export class OCILanguageModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';
  readonly defaultObjectGenerationMode = 'tool';
  readonly supportedUrls: Record<string, RegExp[]> = {};
  private _client?: GenerativeAiInferenceClient;

  constructor(
    public readonly modelId: string,
    private readonly config: OCIConfig
  ) {
    if (!isValidModelId(modelId)) {
      throw new Error(`Invalid model ID: ${modelId}`);
    }
    // Client initialization moved to getClient()
  }

  private async getClient(): Promise<GenerativeAiInferenceClient> {
    if (!this._client) {
      try {
        const authProvider = await createAuthProvider(this.config);
        const regionId = getRegion(this.config);

        this._client = new GenerativeAiInferenceClient({
          authenticationDetailsProvider: authProvider,
        });

        // Set region using proper OCI Region API
        this._client.region = Region.fromRegionId(regionId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error during client initialization';
        throw new Error(
          `Failed to initialize OCI client: ${message}. ` +
            `Check your OCI configuration (config file, credentials, region).`
        );
      }
    }
    return this._client;
  }

  async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
    const messages = convertToOCIMessages(options.prompt);
    const client = await this.getClient();

    const response = (await client.chat({
      chatDetails: {
        compartmentId: this.config.compartmentId ?? '',
        servingMode: {
          servingType: 'ON_DEMAND',
          modelId: this.modelId,
        },
        chatRequest: {
          apiFormat: 'GENERIC',
          messages,
        },
      },
    })) as OCIChatResponse;

    const choice = response.chatResponse?.chatChoice?.[0];
    const textContent = choice?.message?.content?.[0]?.text ?? '';
    const finishReason = mapFinishReason(
      choice?.finishReason ?? 'STOP'
    ) as unknown as LanguageModelV3FinishReason;

    return {
      content: [{ type: 'text', text: textContent }],
      finishReason,
      usage: {
        inputTokens: {
          total: response.chatResponse?.usage?.promptTokens ?? 0,
          noCache: undefined,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: {
          total: response.chatResponse?.usage?.completionTokens ?? 0,
          text: undefined,
          reasoning: undefined,
        },
      },
      warnings: [],
      request: { body: JSON.stringify(messages) },
      response: {
        body: response,
      },
      providerMetadata: {},
    };
  }

  async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
    const messages = convertToOCIMessages(options.prompt);
    const client = await this.getClient();

    const response = (await client.chat({
      chatDetails: {
        compartmentId: this.config.compartmentId ?? '',
        servingMode: {
          servingType: 'ON_DEMAND',
          modelId: this.modelId,
        },
        chatRequest: {
          apiFormat: 'GENERIC',
          messages,
          isStream: true,
        },
      },
    })) as unknown as Response;

    // Parse SSE stream and convert to V3 format
    const sseStream = parseSSEStream(response);
    let textPartId = 0;

    const v3Stream = new ReadableStream<LanguageModelV3StreamPart>({
      async start(controller): Promise<void> {
        try {
          for await (const part of sseStream) {
            if (part.type === 'text-delta') {
              // Convert SSE text-delta to V3 format
              controller.enqueue({
                type: 'text-delta',
                id: `text-${textPartId++}`,
                delta: part.textDelta,
              });
            } else if (part.type === 'finish') {
              // Convert SSE finish to V3 format
              controller.enqueue({
                type: 'finish',
                finishReason: part.finishReason as unknown as LanguageModelV3FinishReason,
                usage: {
                  inputTokens: {
                    total: part.usage.promptTokens,
                    noCache: undefined,
                    cacheRead: undefined,
                    cacheWrite: undefined,
                  },
                  outputTokens: {
                    total: part.usage.completionTokens,
                    text: undefined,
                    reasoning: undefined,
                  },
                },
              });
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream: v3Stream,
      request: { body: JSON.stringify(messages) },
    };
  }
}
