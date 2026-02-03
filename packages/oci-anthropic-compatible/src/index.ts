/**
 * OCI Anthropic-Compatible Proxy
 *
 * Provides an Anthropic Messages API compatible interface
 * that routes requests to OCI GenAI Service.
 */

export { startServer, handleRequest } from './server.js';
export { convertRequest, convertResponse, createErrorResponse } from './converter.js';
export { mapModel, MODEL_MAPPING } from './types.js';
export type {
  ProxyConfig,
  AnthropicMessagesRequest,
  AnthropicMessagesResponse,
  AnthropicMessage,
  AnthropicRole,
  ContentBlock,
  StreamEvent,
} from './types.js';
