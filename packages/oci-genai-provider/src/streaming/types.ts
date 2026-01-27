export interface TextDeltaPart {
  type: 'text-delta';
  textDelta: string;
}

export interface FinishPart {
  type: 'finish';
  finishReason: 'stop' | 'length' | 'content-filter' | 'other';
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export type StreamPart = TextDeltaPart | FinishPart;
