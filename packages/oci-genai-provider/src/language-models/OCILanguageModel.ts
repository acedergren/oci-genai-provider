import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
  LanguageModelV3StreamResult,
} from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import { Region } from 'oci-common';
import type { OCIConfig, RequestOptions } from '../types';
import { isValidModelId, getModelMetadata } from './registry';
import { convertToOCIMessages } from './converters/messages';
import { convertToCohereFormat } from './converters/cohere-messages';
import { mapFinishReason, parseSSEStream } from '../shared/streaming/sse-parser';
import { createAuthProvider, getRegion, getCompartmentId } from '../auth/index.js';
import { handleOCIError } from '../shared/errors/index.js';
import { withRetry, withTimeout, isRetryableError } from '../shared/utils/index.js';

/**
 * Default request options for retry and timeout behavior.
 */
const DEFAULT_REQUEST_OPTIONS: Required<RequestOptions> = {
  timeoutMs: 30000, // 30 seconds
  retry: {
    enabled: true,
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 10000,
  },
};

interface OCIChatChoice {
  message?: {
    content?: Array<{ type?: string; text?: string }>;
  };
  finishReason?: string;
}

interface OCIChatResponseInner {
  // GENERIC format fields
  choices?: OCIChatChoice[];
  chatChoice?: OCIChatChoice[]; // Legacy field name
  // COHERE format fields
  text?: string;
  finishReason?: string;
  chatHistory?: Array<{ role: string; message: string }>;
  // Common fields
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

interface OCIChatResponse {
  // Current OCI API structure (2025+): response wrapped in chatResult
  chatResult?: {
    chatResponse?: OCIChatResponseInner;
  };
  // Legacy structure (for backward compatibility)
  chatResponse?: OCIChatResponseInner;
}

export class OCILanguageModel implements LanguageModelV3 {
  readonly specificationVersion = 'V3';
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

  /**
   * Get effective request options by merging defaults with config and per-request options.
   */
  private getRequestOptions(perRequestOptions?: RequestOptions): Required<RequestOptions> {
    const configOptions = this.config.requestOptions ?? {};

    return {
      timeoutMs:
        perRequestOptions?.timeoutMs ??
        configOptions.timeoutMs ??
        DEFAULT_REQUEST_OPTIONS.timeoutMs,
      retry: {
        ...DEFAULT_REQUEST_OPTIONS.retry,
        ...configOptions.retry,
        ...perRequestOptions?.retry,
      },
    };
  }

  /**
   * Get the appropriate API format for the model.
   * Cohere models require 'COHERE' format, others use 'GENERIC'.
   */
  private getApiFormat(): 'GENERIC' | 'COHERE' {
    const metadata = getModelMetadata(this.modelId);
    return metadata?.family === 'cohere' ? 'COHERE' : 'GENERIC';
  }

  /**
   * Execute an API call with retry and timeout wrappers.
   */
  private async executeWithResilience<T>(
    operation: () => Promise<T>,
    operationName: string,
    requestOptions?: RequestOptions
  ): Promise<T> {
    const options = this.getRequestOptions(requestOptions);

    // Create the operation with timeout
    const withTimeoutOperation = (): Promise<T> =>
      withTimeout(operation(), options.timeoutMs, operationName);

    // If retry is enabled, wrap with retry logic
    if (options.retry.enabled) {
      return withRetry(withTimeoutOperation, {
        maxRetries: options.retry.maxRetries,
        baseDelayMs: options.retry.baseDelayMs,
        maxDelayMs: options.retry.maxDelayMs,
        isRetryable: isRetryableError,
      });
    }

    // Otherwise, just execute with timeout
    return withTimeoutOperation();
  }

  async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
    const messages = convertToOCIMessages(options.prompt);
    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);
    const apiFormat = this.getApiFormat();

    try {
      // Build chatRequest based on API format
      const baseChatRequest =
        apiFormat === 'COHERE'
          ? { apiFormat, ...convertToCohereFormat(messages) }
          : { apiFormat, messages };

      // Add seed parameter if provided
      const chatRequest =
        options.seed !== undefined ? { ...baseChatRequest, seed: options.seed } : baseChatRequest;

      const response = await this.executeWithResilience<OCIChatResponse>(
        () =>
          client.chat({
            chatDetails: {
              compartmentId,
              servingMode: {
                servingType: 'ON_DEMAND',
                modelId: this.modelId,
              },
              chatRequest,
            },
          }) as Promise<OCIChatResponse>,
        'OCI chat request'
      );

      // Handle both GENERIC and COHERE response formats
      const chatResponse = response.chatResult?.chatResponse ?? response.chatResponse;

      if (!chatResponse) {
        throw new Error('No chat response received from OCI');
      }

      // COHERE format: chatResponse.text
      // GENERIC format: chatResponse.choices[0].message.content[0].text
      let textContent: string;
      let finishReason: string;

      if ('text' in chatResponse && typeof chatResponse.text === 'string') {
        // Cohere response format
        textContent = chatResponse.text;
        finishReason = chatResponse.finishReason ?? 'COMPLETE';
      } else {
        // Generic response format
        const choices = chatResponse.choices ?? chatResponse.chatChoice ?? [];
        const choice = choices[0];
        textContent = choice?.message?.content?.[0]?.text ?? '';
        finishReason = choice?.finishReason ?? 'STOP';
      }

      const usage = chatResponse.usage;

      return {
        content: [{ type: 'text', text: textContent }],
        finishReason: mapFinishReason(finishReason),
        usage: {
          inputTokens: {
            total: usage?.promptTokens ?? 0,
            noCache: undefined,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: {
            total: usage?.completionTokens ?? 0,
            text: undefined,
            reasoning: undefined,
          },
        },
        warnings: [],
        // Stringify messages for AI SDK observability/logging
        // Performance overhead: ~5-10ms, acceptable for debugging/tracing
        request: { body: JSON.stringify(messages) },
        response: {
          body: response,
        },
        providerMetadata: {},
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }

  async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
    const messages = convertToOCIMessages(options.prompt);
    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);
    const apiFormat = this.getApiFormat();

    try {
      // Build chatRequest based on API format
      const baseChatRequest =
        apiFormat === 'COHERE'
          ? { apiFormat, ...convertToCohereFormat(messages), isStream: true }
          : { apiFormat, messages, isStream: true };

      // Add seed parameter if provided
      const chatRequest =
        options.seed !== undefined ? { ...baseChatRequest, seed: options.seed } : baseChatRequest;

      // Note: Retry and timeout only apply to connection establishment.
      // Once streaming starts, the stream handles its own errors.
      // OCI SDK returns ReadableStream<Uint8Array> directly for streaming requests
      const stream = await this.executeWithResilience<ReadableStream<Uint8Array>>(
        () =>
          client.chat({
            chatDetails: {
              compartmentId,
              servingMode: {
                servingType: 'ON_DEMAND',
                modelId: this.modelId,
              },
              chatRequest,
            },
          }) as unknown as Promise<ReadableStream<Uint8Array>>,
        'OCI streaming chat request'
      );

      // Parse SSE stream and convert to V3 format
      const sseStream = parseSSEStream(stream);
      const textPartId = 'text-0';
      let isFirstChunk = true;

      const v3Stream = new ReadableStream<LanguageModelV3StreamPart>({
        async start(controller): Promise<void> {
          try {
            for await (const part of sseStream) {
              if (part.type === 'text-delta') {
                // Create text part on first chunk
                if (isFirstChunk) {
                  controller.enqueue({
                    type: 'text-start',
                    id: textPartId,
                  });
                  isFirstChunk = false;
                }
                // Convert SSE text-delta to V3 format
                controller.enqueue({
                  type: 'text-delta',
                  id: textPartId,
                  delta: part.textDelta,
                });
              } else if (part.type === 'finish') {
                // Convert SSE finish to V3 format
                controller.enqueue({
                  type: 'finish',
                  finishReason: part.finishReason,
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
            controller.error(handleOCIError(error));
          }
        },
      });

      return {
        stream: v3Stream,
        // Stringify messages for AI SDK observability/logging
        // Performance overhead: ~5-10ms, acceptable for debugging/tracing
        request: { body: JSON.stringify(messages) },
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }
}
