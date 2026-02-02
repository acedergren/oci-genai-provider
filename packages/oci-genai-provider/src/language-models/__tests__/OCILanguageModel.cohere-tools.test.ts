/**
 * Tests for Cohere tool calling in OCILanguageModel.
 *
 * These tests verify that:
 * 1. isForceSingleStep is set when toolResults are present
 * 2. toolResults are properly passed to the Cohere API
 * 3. Tool calls in chat history are properly formatted for Cohere
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCILanguageModel } from '../OCILanguageModel';
import type { AuthenticationDetailsProvider } from 'oci-common';
import type { OCIConfig } from '../../types';
import { createReadableStream } from '../../__tests__/utils/test-helpers';
import type { LanguageModelV3Prompt } from '@ai-sdk/provider';

// Mock functions
const mockAuthProvider: AuthenticationDetailsProvider = {
  getKeyId: jest.fn(() => Promise.resolve('mock-key-id')),
  getPrivateKey: jest.fn(() => '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----'),
  getPassphrase: jest.fn(() => null),
};

const mockCreateAuthProvider = jest.fn<
  (config: OCIConfig) => Promise<AuthenticationDetailsProvider>
>(() => Promise.resolve(mockAuthProvider));
const mockGetRegion = jest.fn<(config: OCIConfig) => string>(() => 'us-phoenix-1');
const mockGetCompartmentId = jest.fn<(config: OCIConfig) => string>(
  (config) => config.compartmentId ?? 'ocid1.compartment.oc1..test'
);

// Mock auth module
jest.mock('../../auth/index.js', () => ({
  createAuthProvider: (config: OCIConfig): Promise<AuthenticationDetailsProvider> =>
    mockCreateAuthProvider(config),
  getRegion: (config: OCIConfig): string => mockGetRegion(config),
  getCompartmentId: (config: OCIConfig): string => mockGetCompartmentId(config),
}));

// Mock oci-common Region
jest.mock('oci-common', () => ({
  Region: {
    fromRegionId: jest.fn((regionId: string) => ({ regionId })),
  },
}));

// Mock OCI SDK - typed to allow accessing call arguments
interface CohereToolResult {
  call: { name: string; parameters: Record<string, unknown> };
  outputs: Array<{ result: string }>;
}
interface CohereHistoryMessage {
  role: string;
  message: string;
  toolCalls?: Array<{ name: string; parameters: Record<string, unknown> }>;
}
interface CohereChatRequest {
  apiFormat: string;
  message: string;
  chatHistory?: CohereHistoryMessage[];
  toolResults?: CohereToolResult[];
  isForceSingleStep?: boolean;
}
interface ChatCallArgs {
  chatDetails: {
    chatRequest: CohereChatRequest;
    compartmentId: string;
    servingMode: unknown;
  };
}
const mockChat = jest.fn<(args: ChatCallArgs) => Promise<{ body: ReadableStream<Uint8Array> }>>();
jest.mock('oci-generativeaiinference', () => ({
  GenerativeAiInferenceClient: jest.fn().mockImplementation(() => ({
    chat: mockChat,
    region: undefined,
    endpoint: undefined,
  })),
}));

describe('OCILanguageModel - Cohere Tool Calling', () => {
  const mockConfig: OCIConfig = {
    region: 'us-phoenix-1',
    compartmentId: 'ocid1.compartment.oc1..test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('COHERE format with tool results', () => {
    it('should set isForceSingleStep=true when tool results are present', async () => {
      // Prompt with a complete tool call cycle:
      // 1. User asks for weather
      // 2. Assistant calls get_weather tool
      // 3. Tool returns result
      // 4. User asks follow-up
      const prompt: LanguageModelV3Prompt = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'What is the weather in London?' }],
        },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me check the weather.' },
            {
              type: 'tool-call',
              toolCallId: 'call_weather_123',
              toolName: 'get_weather',
              input: { city: 'London' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_weather_123',
              toolName: 'get_weather',
              output: { type: 'text', value: '{"temperature": 15, "condition": "cloudy"}' },
            },
          ],
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'Thanks! Is it good weather for a walk?' }],
        },
      ];

      // Mock response
      mockChat.mockResolvedValueOnce({
        body: createReadableStream([
          'data: {"text": "Yes, 15°C is pleasant for a walk!"}\n\n',
          'data: {"finishReason": "COMPLETE"}\n\n',
        ]),
      });

      const model = new OCILanguageModel(
        'cohere.command-r-plus', // Cohere model
        mockConfig
      );

      await model.doStream({ prompt });

      // Verify the chat request
      expect(mockChat).toHaveBeenCalledTimes(1);
      const chatDetails = mockChat.mock.calls[0][0].chatDetails;
      const chatRequest = chatDetails.chatRequest;

      // Should be COHERE format
      expect(chatRequest.apiFormat).toBe('COHERE');

      // isForceSingleStep should be true when tool results present
      expect(chatRequest.isForceSingleStep).toBe(true);

      // toolResults should be present
      expect(chatRequest.toolResults).toBeDefined();
      expect(chatRequest.toolResults).toHaveLength(1);
      expect(chatRequest.toolResults![0]).toMatchObject({
        call: {
          name: 'get_weather',
          parameters: { city: 'London' },
        },
        outputs: [{ result: '{"temperature": 15, "condition": "cloudy"}' }],
      });
    });

    it('should NOT set isForceSingleStep when no tool results present', async () => {
      const prompt: LanguageModelV3Prompt = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello, how are you?' }],
        },
      ];

      mockChat.mockResolvedValueOnce({
        body: createReadableStream([
          'data: {"text": "I am doing well!"}\n\n',
          'data: {"finishReason": "COMPLETE"}\n\n',
        ]),
      });

      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

      await model.doStream({ prompt });

      const chatRequest = mockChat.mock.calls[0][0].chatDetails.chatRequest;

      // isForceSingleStep should NOT be set (undefined or false)
      expect(chatRequest.isForceSingleStep).toBeFalsy();

      // toolResults should NOT be present
      expect(chatRequest.toolResults).toBeUndefined();
    });

    it('should include toolCalls in chatHistory for assistant messages', async () => {
      const prompt: LanguageModelV3Prompt = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Run pwd command' }],
        },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Running the command...' },
            {
              type: 'tool-call',
              toolCallId: 'call_bash_1',
              toolName: 'bash',
              input: { command: 'pwd' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_bash_1',
              toolName: 'bash',
              output: { type: 'text', value: '/Users/test' },
            },
          ],
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'What directory is that?' }],
        },
      ];

      mockChat.mockResolvedValueOnce({
        body: createReadableStream([
          'data: {"text": "That is your home directory."}\n\n',
          'data: {"finishReason": "COMPLETE"}\n\n',
        ]),
      });

      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

      await model.doStream({ prompt });

      const chatRequest = mockChat.mock.calls[0][0].chatDetails.chatRequest;

      // chatHistory should include the assistant message with toolCalls
      expect(chatRequest.chatHistory).toBeDefined();

      const assistantMessage = chatRequest.chatHistory!.find(
        (m: { role: string; toolCalls?: unknown[] }) => m.role === 'CHATBOT' && m.toolCalls
      );
      expect(assistantMessage).toBeDefined();
      expect(assistantMessage!.toolCalls).toHaveLength(1);
      expect(assistantMessage!.toolCalls![0]).toMatchObject({
        name: 'bash',
        parameters: { command: 'pwd' },
      });
    });

    it('should handle multiple tool calls and results', async () => {
      const prompt: LanguageModelV3Prompt = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'List files and show current directory' }],
        },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Running both commands...' },
            {
              type: 'tool-call',
              toolCallId: 'call_ls',
              toolName: 'bash',
              input: { command: 'ls' },
            },
            {
              type: 'tool-call',
              toolCallId: 'call_pwd',
              toolName: 'bash',
              input: { command: 'pwd' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_ls',
              toolName: 'bash',
              output: { type: 'text', value: 'file1.txt\nfile2.txt' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_pwd',
              toolName: 'bash',
              output: { type: 'text', value: '/home/user' },
            },
          ],
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'Thanks!' }],
        },
      ];

      mockChat.mockResolvedValueOnce({
        body: createReadableStream([
          'data: {"text": "You have 2 files in /home/user"}\n\n',
          'data: {"finishReason": "COMPLETE"}\n\n',
        ]),
      });

      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

      await model.doStream({ prompt });

      const chatRequest = mockChat.mock.calls[0][0].chatDetails.chatRequest;

      // Should have 2 tool results
      expect(chatRequest.toolResults).toHaveLength(2);
      expect(chatRequest.isForceSingleStep).toBe(true);

      // Verify both results
      const lsResult = chatRequest.toolResults!.find(
        (r) => (r.call.parameters as { command: string }).command === 'ls'
      );
      const pwdResult = chatRequest.toolResults!.find(
        (r) => (r.call.parameters as { command: string }).command === 'pwd'
      );

      expect(lsResult!.outputs[0].result).toBe('file1.txt\nfile2.txt');
      expect(pwdResult!.outputs[0].result).toBe('/home/user');
    });
  });
});
