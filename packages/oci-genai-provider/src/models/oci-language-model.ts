import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3FinishReason,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamResult,
} from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import type { OCIConfig } from '../types';
import { isValidModelId } from './registry';
import { convertToOCIMessages } from '../converters/messages';
import { mapFinishReason } from '../streaming/sse-parser';

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
  private client: GenerativeAiInferenceClient;

  constructor(
    public readonly modelId: string,
    private readonly config: OCIConfig
  ) {
    if (!isValidModelId(modelId)) {
      throw new Error(`Invalid model ID: ${modelId}`);
    }
    this.client = new GenerativeAiInferenceClient({
      authenticationDetailsProvider: {} as never,
    });
  }

  async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
    const messages = convertToOCIMessages(options.prompt);

    const response = (await this.client.chat({
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

  doStream(_options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
    return Promise.reject(new Error('Not implemented'));
  }
}
