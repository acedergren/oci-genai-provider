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
import { GenerativeAiInferenceClient, models as OCIModel } from 'oci-generativeaiinference';
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
import {
  toOCIReasoningEffort,
  createThinkingConfig,
  type OCIApiFormat,
  type OCIUsageStats,
} from '../shared/oci-sdk-types';

interface OCIChatChoice {
  message?: {
    content?: Array<{
      type?: string;
      text?: string;
      thinking?: string;
      imageUrl?: { url: string };
    }>;
    toolCalls?: OCIToolCall[];
    reasoningContent?: string;
  };
  finishReason?: string;
}

interface OCIChatResponseInner {
  choices?: OCIChatChoice[];
  chatChoice?: OCIChatChoice[];
  text?: string;
  finishReason?: string;
  chatHistory?: Array<{ role: string; message: string }>;
  toolCalls?: OCIToolCall[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    completionTokensDetails?: {
      reasoningTokens?: number;
    };
  };
}

interface OCIChatResponse {
  opcRequestId?: string;
  chatResult?: {
    modelId?: string;
    chatResponse?: OCIChatResponseInner;
  };
  chatResponse?: OCIChatResponseInner;
  headers?: { entries(): IterableIterator<[string, string]> };
}

type ChatRequest =
  | OCIModel.GenericChatRequest
  | OCIModel.CohereChatRequest
  | OCIModel.CohereChatRequestV2;

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

  private getRequestOptions(perRequestOptions?: RequestOptions): Required<RequestOptions> {
    return resolveRequestOptions(this.config.requestOptions, perRequestOptions);
  }

  private getApiFormat(): OCIApiFormat {
    const metadata = getModelMetadata(this.modelId);
    if (metadata?.family === 'cohere') {
      if (
        this.modelId.includes('-03-2025') ||
        this.modelId.includes('-07-2025') ||
        this.modelId.includes('-08-2025')
      ) {
        return 'COHEREV2';
      }
      return 'COHERE';
    }
    return 'GENERIC';
  }

  private async executeWithResilience<T>(
    operation: () => Promise<T>,
    operationName: string,
    requestOptions?: RequestOptions
  ): Promise<T> {
    const options = this.getRequestOptions(requestOptions);
    const withTimeoutOperation = (): Promise<T> =>
      withTimeout(operation(), options.timeoutMs, operationName);

    if (options.retry.enabled) {
      return withRetry(withTimeoutOperation, {
        maxRetries: options.retry.maxRetries,
        baseDelayMs: options.retry.baseDelayMs,
        maxDelayMs: options.retry.maxDelayMs,
        isRetryable: isRetryableError,
      });
    }

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

    try {
      const commonParams = {
        maxTokens: options.maxOutputTokens,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
        frequencyPenalty: options.frequencyPenalty,
        presencePenalty: options.presencePenalty,
      };

      const toolParams =
        modelSupportsTools && functionTools.length > 0
          ? {
              tools: convertToOCITools(functionTools, apiFormat),
              ...(options.toolChoice
                ? { toolChoice: convertToOCIToolChoice(options.toolChoice) }
                : {}),
            }
          : {};

      let chatRequest: ChatRequest;
      if (apiFormat === 'COHEREV2') {
        chatRequest = {
          apiFormat,
          messages: messages.map((m) => {
            const content: OCIModel.CohereContentV2[] = m.content.map((c) => {
              if (c.type === 'IMAGE') {
                return {
                  type: 'IMAGE_URL',
                  imageUrl: c.imageUrl as OCIModel.CohereImageUrlV2,
                } as OCIModel.CohereImageContentV2;
              }
              return { type: 'TEXT', text: c.text ?? '' } as OCIModel.CohereTextContentV2;
            });
            return {
              role: m.role === 'ASSISTANT' ? 'CHATBOT' : m.role,
              content,
            } as OCIModel.CohereMessageV2;
          }),
          ...commonParams,
          ...toolParams,
          stopSequences: options.stopSequences,
        } as OCIModel.CohereChatRequestV2;
      } else if (apiFormat === 'COHERE') {
        chatRequest = {
          apiFormat,
          ...convertToCohereFormat(messages),
          ...commonParams,
          ...toolParams,
          stopSequences: options.stopSequences,
        } as OCIModel.CohereChatRequest;
      } else {
        chatRequest = {
          apiFormat,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content.map((c) => {
              if (c.type === 'IMAGE') {
                return {
                  type: 'IMAGE',
                  imageUrl: c.imageUrl,
                };
              }
              return {
                type: 'TEXT',
                text: c.text ?? '',
              };
            }) as OCIModel.ChatContent[],
          })) as OCIModel.Message[],
          ...commonParams,
          ...toolParams,
          stop: options.stopSequences,
        } as OCIModel.GenericChatRequest;
      }

      if (ociOptions?.reasoningEffort && apiFormat === 'GENERIC') {
        // Cast to SDK enum type - our string literal matches the enum value
        (chatRequest as OCIModel.GenericChatRequest).reasoningEffort = toOCIReasoningEffort(
          ociOptions.reasoningEffort
        ) as OCIModel.GenericChatRequest.ReasoningEffort;
      }

      if (ociOptions?.thinking && (apiFormat === 'COHEREV2' || apiFormat === 'COHERE')) {
        // Cast to SDK type - our config structure matches CohereThinkingV2
        (chatRequest as OCIModel.CohereChatRequestV2).thinking =
          createThinkingConfig(true, ociOptions.tokenBudget) as OCIModel.CohereThinkingV2;
      }

      if (options.seed !== undefined) {
        chatRequest.seed = options.seed;
      }

      const response = (await this.executeWithResilience<unknown>(
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
          }),
        'OCI chat request',
        ociOptions?.requestOptions
      )) as OCIChatResponse;

      const chatResponse = response.chatResult?.chatResponse ?? response.chatResponse;

      if (!chatResponse) {
        throw new InvalidResponseDataError({
          message: 'No chat response received from OCI.',
          data: response,
        });
      }

      const content: LanguageModelV3Content[] = [];
      let finishReason: string;
      let toolCalls: OCIToolCall[] | undefined;

      if ('text' in chatResponse && typeof chatResponse.text === 'string') {
        content.push({ type: 'text', text: chatResponse.text });
        finishReason = chatResponse.finishReason ?? 'COMPLETE';
        toolCalls = chatResponse.toolCalls;
      } else {
        const choices = chatResponse.choices ?? chatResponse.chatChoice ?? [];
        const choice = choices[0];
        const msg = choice?.message;

        if (msg?.reasoningContent) {
          content.push({ type: 'reasoning', text: msg.reasoningContent });
        }

        if (msg?.content) {
          for (const part of msg.content) {
            if (part.type === 'TEXT' || (!part.type && part.text)) {
              content.push({ type: 'text', text: part.text ?? '' });
            } else if (part.type === 'THINKING' || (!part.type && part.thinking)) {
              content.push({ type: 'reasoning', text: part.thinking ?? '' });
            }
          }
        }

        finishReason = choice?.finishReason ?? 'STOP';
        toolCalls = msg?.toolCalls;
      }

      if (toolCalls && toolCalls.length > 0 && modelSupportsTools) {
        content.push(...convertFromOCIToolCalls(toolCalls, apiFormat));
      }

      const ociUsage = chatResponse.usage as OCIUsageStats | undefined;
      const reasoningTokens = ociUsage?.completionTokensDetails?.reasoningTokens;

      return {
        content: content.length > 0 ? content : [{ type: 'text', text: '' }],
        finishReason: mapFinishReason(finishReason),
        usage: {
          inputTokens: {
            total: ociUsage?.promptTokens ?? 0,
            noCache: undefined,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: {
            total: ociUsage?.completionTokens ?? 0,
            text: undefined,
            reasoning: reasoningTokens,
          },
        },
        warnings,
        request: { body: JSON.stringify(messages) },
        response: {
          id: response.opcRequestId,
          modelId: response.chatResult?.modelId,
          headers: response.opcRequestId ? { 'opc-request-id': response.opcRequestId } : undefined,
          body: response,
        },
        providerMetadata: {
          oci: { requestId: response.opcRequestId, modelId: response.chatResult?.modelId },
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

    const modelSupportsTools = supportsToolCalling(this.modelId);
    const hasTools = options.tools && options.tools.length > 0;
    const functionTools = hasTools
      ? (options.tools!.filter((t) => t.type === 'function') as LanguageModelV3FunctionTool[])
      : [];

    try {
      const commonParams = {
        maxTokens: options.maxOutputTokens,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
        frequencyPenalty: options.frequencyPenalty,
        presencePenalty: options.presencePenalty,
        isStream: true,
      };

      const toolParams =
        modelSupportsTools && functionTools.length > 0
          ? {
              tools: convertToOCITools(functionTools, apiFormat),
              ...(options.toolChoice
                ? { toolChoice: convertToOCIToolChoice(options.toolChoice) }
                : {}),
            }
          : {};

      let chatRequest: ChatRequest;
      if (apiFormat === 'COHEREV2') {
        chatRequest = {
          apiFormat,
          messages: messages.map((m) => {
            const content: OCIModel.CohereContentV2[] = m.content.map((c) => {
              if (c.type === 'IMAGE') {
                return {
                  type: 'IMAGE_URL',
                  imageUrl: c.imageUrl as OCIModel.CohereImageUrlV2,
                } as OCIModel.CohereImageContentV2;
              }
              return { type: 'TEXT', text: c.text ?? '' } as OCIModel.CohereTextContentV2;
            });
            return {
              role: m.role === 'ASSISTANT' ? 'CHATBOT' : m.role,
              content,
            } as OCIModel.CohereMessageV2;
          }),
          ...commonParams,
          ...toolParams,
          stopSequences: options.stopSequences,
        } as OCIModel.CohereChatRequestV2;
      } else if (apiFormat === 'COHERE') {
        chatRequest = {
          apiFormat,
          ...convertToCohereFormat(messages),
          ...commonParams,
          ...toolParams,
          stopSequences: options.stopSequences,
        } as OCIModel.CohereChatRequest;
      } else {
        chatRequest = {
          apiFormat,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content.map((c) => {
              if (c.type === 'IMAGE') {
                return {
                  type: 'IMAGE',
                  imageUrl: c.imageUrl,
                };
              }
              return {
                type: 'TEXT',
                text: c.text ?? '',
              };
            }) as OCIModel.ChatContent[],
          })) as OCIModel.Message[],
          ...commonParams,
          ...toolParams,
          stop: options.stopSequences,
        } as OCIModel.GenericChatRequest;
      }

      if (ociOptions?.reasoningEffort && apiFormat === 'GENERIC') {
        // Cast to SDK enum type - our string literal matches the enum value
        (chatRequest as OCIModel.GenericChatRequest).reasoningEffort = toOCIReasoningEffort(
          ociOptions.reasoningEffort
        ) as OCIModel.GenericChatRequest.ReasoningEffort;
      }

      if (ociOptions?.thinking && (apiFormat === 'COHEREV2' || apiFormat === 'COHERE')) {
        // Cast to SDK type - our config structure matches CohereThinkingV2
        (chatRequest as OCIModel.CohereChatRequestV2).thinking =
          createThinkingConfig(true, ociOptions.tokenBudget) as OCIModel.CohereThinkingV2;
      }

      if (options.seed !== undefined) chatRequest.seed = options.seed;

      const response = (await this.executeWithResilience<unknown>(
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
          }),
        'OCI chat stream',
        ociOptions?.requestOptions
      )) as {
        body?: ReadableStream<Uint8Array>;
        headers?: { entries(): IterableIterator<[string, string]> };
      };

      const streamInput = response.body ?? (response as unknown as ReadableStream<Uint8Array>);

      if (!streamInput) {
        throw new Error('No stream received from OCI.');
      }

      const stream = parseSSEStream(streamInput, {
        includeRawChunks: options.includeRawChunks,
      });

      return {
        stream: new ReadableStream<LanguageModelV3StreamPart>({
          async start(controller) {
            controller.enqueue({ type: 'stream-start', warnings });

            let hasText = false;
            let hasReasoning = false;
            const textId = `text-${Date.now()}`;
            const reasoningId = `reasoning-${Date.now()}`;

            try {
              for await (const part of stream) {
                switch (part.type) {
                  case 'text-delta':
                    if (!hasText) {
                      controller.enqueue({ type: 'text-start', id: textId });
                      hasText = true;
                    }
                    controller.enqueue({
                      type: 'text-delta',
                      delta: part.textDelta,
                      id: textId,
                    });
                    break;
                  case 'reasoning-delta':
                    if (!hasReasoning) {
                      controller.enqueue({ type: 'reasoning-start', id: reasoningId });
                      hasReasoning = true;
                    }
                    controller.enqueue({
                      type: 'reasoning-delta',
                      delta: part.reasoningDelta,
                      id: reasoningId,
                    });
                    break;
                  case 'tool-call':
                    controller.enqueue({
                      type: 'tool-call',
                      toolCallId: part.toolCallId,
                      toolName: part.toolName,
                      input: part.input,
                    });
                    break;
                  case 'finish':
                    if (hasText) {
                      controller.enqueue({ type: 'text-end', id: textId });
                    }
                    if (hasReasoning) {
                      controller.enqueue({ type: 'reasoning-end', id: reasoningId });
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
                          reasoning: part.usage.reasoningTokens,
                        },
                      },
                    });
                    break;
                  case 'raw':
                    controller.enqueue({ type: 'raw', rawValue: part.rawValue });
                    break;
                }
              }
            } catch (error) {
              controller.enqueue({ type: 'error', error });
            } finally {
              controller.close();
            }
          },
        }),
        request: { body: JSON.stringify(messages) },
        response: {
          headers: response.headers ? Object.fromEntries(response.headers.entries()) : undefined,
        },
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }
}
