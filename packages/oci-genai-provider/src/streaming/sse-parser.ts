import type { StreamPart } from './types';

export function mapFinishReason(reason: string): 'stop' | 'length' | 'content-filter' | 'other' {
  switch (reason) {
    case 'STOP':
      return 'stop';
    case 'LENGTH':
      return 'length';
    case 'CONTENT_FILTER':
      return 'content-filter';
    default:
      return 'other';
  }
}

// eslint-disable-next-line require-yield, @typescript-eslint/require-await
export async function* parseSSEStream(_response: Response): AsyncGenerator<StreamPart> {
  // Will be implemented in Task 5
  throw new Error('Not implemented');
}
