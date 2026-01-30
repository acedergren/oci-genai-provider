import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3FunctionTool,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
  LanguageModelV3StreamResult,
  SharedV3Warning,
} from '@ai-sdk/provider';
import { InvalidResponseDataError, NoSuchModelError } from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import { Region } from 'oci-common';
import type { OCIConfig, RequestOptions } from '../types';
import { isValidModelId, getModelMetadata } from './registry';
import { convertToOCIMessages } from './converters/messages';
import { convertToCohereFormat } from './converters/cohere-messages';
import {
  convertToOCITools,
  convertToOCIToolChoice,
  convertFromOCIToolCalls,
  supportsToolCalling,
} from './converters/tools';
import type { OCIToolCall } from './converters/tools';
import { mapFinishReason, parseSSEStream } from '../shared/streaming/sse-parser';
import { createAuthProvider, getRegion, getCompartmentId } from '../auth/index.js';
import { handleOCIError } from '../shared/errors/index.js';
import { withRetry, withTimeout, isRetryableError } from '../shared/utils/index.js';
import {
  getOCIProviderOptions,
  resolveCompartmentId,
  resolveEndpoint,
  resolveServingMode,
} from '../shared/provider-options';
import { resolveRequestOptions } from '../shared/request-options';

interface OCIChatChoice {
  message?: {
    content?: Array<{ type?: string; text?: string }>;
    toolCalls?: OCIToolCall[];
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
  toolCalls?: OCIToolCall[]; // Cohere tool calls at response level
  // Common fields
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

interface OCIChatResponse {
  opcRequestId?: string;
  // Current OCI API structure (2025+): response wrapped in chatResult
  chatResult?: {
    modelId?: string;
    chatResponse?: OCIChatResponseInner;
  };
  // Legacy structure (for backward compatibility)
  chatResponse?: OCIChatResponseInner;
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
      throw new NoSuchModelError({
        modelId,
        modelType: 'languageModel',
      });
    }
    // Client initialization moved to getClient()
  }

  private async getClient(endpointOverride?: string): Promise<GenerativeAiInferenceClient> {
    const resolvedEndpoint = resolveEndpoint(this.config.endpoint, endpointOverride);

    if (!this._client || (endpointOverride && endpointOverride !== this.config.endpoint)) {
      try {
        const authProvider = await createAuthProvider(this.config);
        const regionId = getRegion(this.config);

        const client = new GenerativeAiInferenceClient({
          authenticationDetailsProvider: authProvider,
        });

        // Set region using proper OCI Region API
        client.region = Region.fromRegionId(regionId);

        if (resolvedEndpoint) {
          client.endpoint = resolvedEndpoint;
        }

        if (!endpointOverride || endpointOverride === this.config.endpoint) {
          this._client = client;
        }

        return client;
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
    return resolveRequestOptions(this.config.requestOptions, perRequestOptions);
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
    const ociOptions = getOCIProviderOptions(options.providerOptions);
    const client = await this.getClient(ociOptions?.endpoint);
    const compartmentId = resolveCompartmentId(
      getCompartmentId(this.config),
      ociOptions?.compartmentId
    );
    const apiFormat = this.getApiFormat();
    const warnings: SharedV3Warning[] = [];

    if (options.responseFormat?.type === 'json') {
      warnings.push({
        type: 'unsupported',
        feature: 'responseFormat.json',
        details: 'OCI response format JSON is not supported in this provider.',
      });
    }

    // Check tool calling support for this model
    const modelSupportsTools = supportsToolCalling(this.modelId);
    const hasTools = options.tools && options.tools.length > 0;
    const functionTools = hasTools
      ? (options.tools!.filter((t) => t.type === 'function') as LanguageModelV3FunctionTool[])
      : [];

    if (hasTools && !modelSupportsTools) {
      warnings.push({
        type: 'unsupported',
        feature: 'tools',
        details: `Model ${this.modelId} does not support tool calling. Supported: Llama 3.1+, Cohere Command R/R+, Grok, Gemini.`,
      });
    }

    if (options.toolChoice && options.toolChoice.type !== 'auto' && !modelSupportsTools) {
      warnings.push({
        type: 'unsupported',
        feature: 'toolChoice',
        details: `Model ${this.modelId} does not support tool choice options.`,
      });
    }

    try {
      // Build chatRequest based on API format
      const commonParams = {
        maxTokens: options.maxOutputTokens,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
        frequencyPenalty: options.frequencyPenalty,
        presencePenalty: options.presencePenalty,
      };

      // Convert tools if model supports them
      const toolParams =
        modelSupportsTools && functionTools.length > 0
          ? {
              tools: convertToOCITools(functionTools, apiFormat),
              ...(options.toolChoice ? { toolChoice: convertToOCIToolChoice(options.toolChoice) } : {}),
            }
          : {};

      const baseChatRequest =
        apiFormat === 'COHERE'
          ? {
              apiFormat,
              ...convertToCohereFormat(messages),
              ...commonParams,
              ...toolParams,
              stopSequences: options.stopSequences,
            }
          : {
              apiFormat,
              messages,
              ...commonParams,
              ...toolParams,
              stop: options.stopSequences,
            };

      // Add seed parameter if provided
      const chatRequest =
        options.seed !== undefined ? { ...baseChatRequest, seed: options.seed } : baseChatRequest;

      const response = await this.executeWithResilience<OCIChatResponse>(
        () =>
          client.chat({
            chatDetails: {
              compartmentId,
              servingMode: resolveServingMode(
                this.modelId,
                this.config.servingMode,
                ociOptions?.servingMode
              ),
              chatRequest,
            },
          }) as Promise<OCIChatResponse>,
        'OCI chat request',
        ociOptions?.requestOptions
      );

      // Handle both GENERIC and COHERE response formats
      const chatResponse = response.chatResult?.chatResponse ?? response.chatResponse;

      if (!chatResponse) {
        throw new InvalidResponseDataError({
          message: 'No chat response received from OCI.',
          data: response,
        });
      }

      // COHERE format: chatResponse.text
      // GENERIC format: chatResponse.choices[0].message.content[0].text
      let textContent: string;
      let finishReason: string;
      let toolCalls: OCIToolCall[] | undefined;

      if ('text' in chatResponse && typeof chatResponse.text === 'string') {
        // Cohere response format
        textContent = chatResponse.text;
        finishReason = chatResponse.finishReason ?? 'COMPLETE';
        toolCalls = chatResponse.toolCalls;
      } else {
        // Generic response format
        const choices = chatResponse.choices ?? chatResponse.chatChoice ?? [];
        const choice = choices[0];
        textContent = choice?.message?.content?.[0]?.text ?? '';
        finishReason = choice?.finishReason ?? 'STOP';
        toolCalls = choice?.message?.toolCalls;
      }

      // Build content parts: text + tool calls
      const content: LanguageModelV3Content[] = [];

      if (textContent) {
        content.push({ type: 'text', text: textContent });
      }

      // Convert tool calls to AI SDK format
      if (toolCalls && toolCalls.length > 0 && modelSupportsTools) {
        const sdkToolCalls = convertFromOCIToolCalls(toolCalls, apiFormat);
        content.push(...sdkToolCalls);
      }

      const usage = chatResponse.usage;

      return {
        content: content.length > 0 ? content : [{ type: 'text', text: '' }],
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
        warnings,
        // Stringify messages for AI SDK observability/logging
        // Performance overhead: ~5-10ms, acceptable for debugging/tracing
        request: { body: JSON.stringify(messages) },
        response: {
          id: response.opcRequestId,
          modelId: response.chatResult?.modelId,
          headers: response.opcRequestId ? { 'opc-request-id': response.opcRequestId } : undefined,
          body: response,
        },
        providerMetadata: {
          oci: {
            requestId: response.opcRequestId,
            modelId: response.chatResult?.modelId,
          },
        },
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }

  async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
    const messages = convertToOCIMessages(options.prompt);
    const ociOptions = getOCIProviderOptions(options.providerOptions);
    const client = await this.getClient(ociOptions?.endpoint);
    const compartmentId = resolveCompartmentId(
      getCompartmentId(this.config),
      ociOptions?.compartmentId
    );
    const apiFormat = this.getApiFormat();
    const warnings: SharedV3Warning[] = [];

    if (options.responseFormat?.type === 'json') {
      warnings.push({
        type: 'unsupported',
        feature: 'responseFormat.json',
        details: 'OCI response format JSON is not supported in this provider.',
      });
    }

    // Check tool calling support for this model
    const modelSupportsTools = supportsToolCalling(this.modelId);
    const hasTools = options.tools && options.tools.length > 0;
    const functionTools = hasTools
      ? (options.tools!.filter((t) => t.type === 'function') as LanguageModelV3FunctionTool[])
      : [];

    if (hasTools && !modelSupportsTools) {
      warnings.push({
        type: 'unsupported',
        feature: 'tools',
        details: `Model ${this.modelId} does not support tool calling. Supported: Llama 3.1+, Cohere Command R/R+, Grok, Gemini.`,
      });
    }

    if (options.toolChoice && options.toolChoice.type !== 'auto' && !modelSupportsTools) {
      warnings.push({
        type: 'unsupported',
        feature: 'toolChoice',
        details: `Model ${this.modelId} does not support tool choice options.`,
      });
    }

    try {
      // Build chatRequest based on API format
      const commonParams = {
        maxTokens: options.maxOutputTokens,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
        frequencyPenalty: options.frequencyPenalty,
        presencePenalty: options.presencePenalty,
      };

      // Convert tools if model supports them
      const toolParams =
        modelSupportsTools && functionTools.length > 0
          ? {
              tools: convertToOCITools(functionTools, apiFormat),
              ...(options.toolChoice ? { toolChoice: convertToOCIToolChoice(options.toolChoice) } : {}),
            }
          : {};

      const baseChatRequest =
        apiFormat === 'COHERE'
          ? {
              apiFormat,
              ...convertToCohereFormat(messages),
              ...commonParams,
              ...toolParams,
              stopSequences: options.stopSequences,
              isStream: true,
            }
          : {
              apiFormat,
              messages,
              ...commonParams,
              ...toolParams,
              stop: options.stopSequences,
              isStream: true,
            };

      // Add seed parameter if provided
      const chatRequest =
        options.seed !== undefined ? { ...baseChatRequest, seed: options.seed } : baseChatRequest;

      // Note: Retry and timeout only apply to connection establishment.
      // Once streaming starts, the stream handles its own errors.
      // OCI SDK returns ReadableStream<Uint8Array> directly for streaming requests
      const streamResponse = await this.executeWithResilience<
        ReadableStream<Uint8Array> | Response
      >(
        () =>
          client.chat({
            chatDetails: {
              compartmentId,
              servingMode: resolveServingMode(
                this.modelId,
                this.config.servingMode,
                ociOptions?.servingMode
              ),
              chatRequest,
            },
          }) as unknown as Promise<ReadableStream<Uint8Array>>,
        'OCI streaming chat request',
        ociOptions?.requestOptions
      );

      // Parse SSE stream and convert to V3 format
      const responseHeaders =
        streamResponse instanceof Response
          ? Object.fromEntries(streamResponse.headers.entries())
          : undefined;
      const sseStream = parseSSEStream(streamResponse, {
        includeRawChunks: options.includeRawChunks,
      });
      const textPartId = 'text-0';
      let isFirstChunk = true;
      let textEnded = false;
      let toolCallIndex = 0;

      const v3Stream = new ReadableStream<LanguageModelV3StreamPart>({
        async start(controller): Promise<void> {
          try {
            controller.enqueue({
              type: 'stream-start',
              warnings,
            });
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
              } else if (part.type === 'tool-call') {
                // End text part before tool calls if needed
                if (!isFirstChunk && !textEnded) {
                  controller.enqueue({
                    type: 'text-end',
                    id: textPartId,
                  });
                  textEnded = true;
                }
                // Emit complete tool call (OCI doesn't stream tool call arguments incrementally)
                toolCallIndex++;
                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  input: part.input,
                });
              } else if (part.type === 'finish') {
                // Convert SSE finish to V3 format
                if (!isFirstChunk && !textEnded) {
                  controller.enqueue({
                    type: 'text-end',
                    id: textPartId,
                  });
                  textEnded = true;
                }
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
              } else if (part.type === 'raw') {
                controller.enqueue({
                  type: 'raw',
                  rawValue: part.rawValue,
                });
              }
            }
            controller.close();
          } catch (error) {
            controller.enqueue({
              type: 'error',
              error: handleOCIError(error),
            });
            controller.close();
          }
        },
      });

      return {
        stream: v3Stream,
        // Stringify messages for AI SDK observability/logging
        // Performance overhead: ~5-10ms, acceptable for debugging/tracing
        request: { body: JSON.stringify(messages) },
        response: responseHeaders ? { headers: responseHeaders } : undefined,
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }
}
