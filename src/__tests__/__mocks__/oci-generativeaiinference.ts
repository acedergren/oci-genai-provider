export class GenerativeAiInferenceClient {
  constructor(_params: { authenticationDetailsProvider: unknown }) {
    // Mock client - no actual implementation
  }

  chat(_request: unknown): Promise<unknown> {
    // Mock chat method
    return Promise.resolve({});
  }
}

export class ChatRequest {
  constructor(public body: unknown) {}
}

export class ChatDetails {
  constructor(
    public servingMode: unknown,
    public compartmentId: string,
    public chatRequest: unknown
  ) {}
}

export class OnDemandServingMode {
  constructor(public modelId: string) {}
  static readonly modelType = 'ON_DEMAND';
}

export class DedicatedServingMode {
  constructor(public endpointId: string) {}
  static readonly modelType = 'DEDICATED';
}

export class Message {
  constructor(
    public role: string,
    public content: Array<{ type: string; text?: string }>
  ) {}
}

export class BaseChatRequest {
  constructor(
    public messages: unknown[],
    public maxTokens?: number,
    public temperature?: number,
    public topP?: number,
    public topK?: number,
    public frequencyPenalty?: number,
    public presencePenalty?: number,
    public stop?: string[],
    public isStream?: boolean
  ) {}
}

export class CohereChatRequest extends BaseChatRequest {}
export class LlamaChatRequest extends BaseChatRequest {}
export class GenericChatRequest extends BaseChatRequest {}
