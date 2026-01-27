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
import { isValidModelId } from './registry';
import { convertToOCIMessages } from '../converters/messages';
import { mapFinishReason, parseSSEStream } from '../streaming/sse-parser';
import { createAuthProvider, getRegion, getCompartmentId } from '../auth/index.js';
import { handleOCIError } from '../errors/index.js';
import { withRetry, withTimeout, isRetryableError } from '../utils/index.js';

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
        enabled:
          perRequestOptions?.retry?.enabled ??
          configOptions.retry?.enabled ??
          DEFAULT_REQUEST_OPTIONS.retry.enabled,
        maxRetries:
          perRequestOptions?.retry?.maxRetries ??
          configOptions.retry?.maxRetries ??
          DEFAULT_REQUEST_OPTIONS.retry.maxRetries,
        baseDelayMs:
          perRequestOptions?.retry?.baseDelayMs ??
          configOptions.retry?.baseDelayMs ??
          DEFAULT_REQUEST_OPTIONS.retry.baseDelayMs,
        maxDelayMs:
          perRequestOptions?.retry?.maxDelayMs ??
          configOptions.retry?.maxDelayMs ??
          DEFAULT_REQUEST_OPTIONS.retry.maxDelayMs,
      },
    };
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

    try {
      const response = await this.executeWithResilience<OCIChatResponse>(
        () =>
          client.chat({
            chatDetails: {
              compartmentId,
              servingMode: {
                servingType: 'ON_DEMAND',
                modelId: this.modelId,
              },
              chatRequest: {
                apiFormat: 'GENERIC',
                messages,
              },
            },
          }) as Promise<OCIChatResponse>,
        'OCI chat request'
      );

      const choice = response.chatResponse?.chatChoice?.[0];
      const textContent = choice?.message?.content?.[0]?.text ?? '';
      const finishReason = mapFinishReason(choice?.finishReason ?? 'STOP');

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

    try {
      // Note: Retry and timeout only apply to connection establishment.
      // Once streaming starts, the stream handles its own errors.
      const response = await this.executeWithResilience<Response>(
        () =>
          client.chat({
            chatDetails: {
              compartmentId,
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
          }) as unknown as Promise<Response>,
        'OCI streaming chat request'
      );

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
