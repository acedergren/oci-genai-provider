/**
 * Anthropic-Compatible Proxy Server
 *
 * HTTP server that accepts Anthropic Messages API requests and
 * proxies them to OCI GenAI using the native provider.
 */

import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText, streamText } from 'ai';
import type { ProxyConfig, AnthropicMessagesRequest, StreamEvent } from './types.js';
import { anthropicMessagesRequestSchema } from './types.js';
import { convertRequest, convertResponse, createErrorResponse } from './converter.js';
import { ZodError } from 'zod';

/**
 * Create the OCI provider instance
 */
function createProvider(config: ProxyConfig): ReturnType<typeof createOCI> {
  return createOCI({
    compartmentId: config.compartmentId,
    profile: config.profile,
  });
}

/**
 * Check if origin is allowed based on config
 */
function isOriginAllowed(origin: string | null, config: ProxyConfig): boolean {
  if (!origin) return false;

  const allowed = config.allowedOrigins ?? ['http://localhost'];

  // Check if any allowed pattern matches
  return allowed.some((pattern) => {
    // Support wildcard suffix like http://localhost:*
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return origin.startsWith(prefix);
    }
    return origin === pattern;
  });
}

/**
 * Handle non-streaming request
 */
async function handleNonStreaming(
  request: AnthropicMessagesRequest,
  config: ProxyConfig
): Promise<Response> {
  const provider = createProvider(config);
  const converted = convertRequest(request);

  if (config.verbose) {
    console.warn(`[proxy] Non-streaming request for model: ${converted.model}`);
  }

  const result = await generateText({
    model: provider.languageModel(converted.model),
    messages: converted.messages,
    maxOutputTokens: converted.maxOutputTokens,
    temperature: converted.temperature,
    topP: converted.topP,
    stopSequences: converted.stopSequences,
    system: converted.system,
  });

  const response = convertResponse(result.text, request.model, result.finishReason, {
    inputTokens: result.usage.inputTokens ?? 0,
    outputTokens: result.usage.outputTokens ?? 0,
  });

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': response.id,
    },
  });
}

/**
 * Handle streaming request
 */
function handleStreaming(request: AnthropicMessagesRequest, config: ProxyConfig): Response {
  const provider = createProvider(config);
  const converted = convertRequest(request);

  if (config.verbose) {
    console.warn(`[proxy] Streaming request for model: ${converted.model}`);
  }

  const result = streamText({
    model: provider.languageModel(converted.model),
    messages: converted.messages,
    maxOutputTokens: converted.maxOutputTokens,
    temperature: converted.temperature,
    topP: converted.topP,
    stopSequences: converted.stopSequences,
    system: converted.system,
  });

  const messageId = `msg_${Date.now().toString(36)}`;
  let outputTokens = 0;

  const stream = new ReadableStream({
    async start(controller): Promise<void> {
      const encoder = new TextEncoder();

      // Send message_start event
      const startEvent: StreamEvent = {
        type: 'message_start',
        message: {
          id: messageId,
          type: 'message',
          role: 'assistant',
          model: request.model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 },
          content: [],
        },
      };
      controller.enqueue(
        encoder.encode(`event: message_start\ndata: ${JSON.stringify(startEvent)}\n\n`)
      );

      // Send content_block_start
      const blockStartEvent: StreamEvent = {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' },
      };
      controller.enqueue(
        encoder.encode(`event: content_block_start\ndata: ${JSON.stringify(blockStartEvent)}\n\n`)
      );

      try {
        // Stream text deltas
        for await (const chunk of result.textStream) {
          outputTokens += 1; // Rough estimate
          const deltaEvent: StreamEvent = {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: chunk },
          };
          controller.enqueue(
            encoder.encode(`event: content_block_delta\ndata: ${JSON.stringify(deltaEvent)}\n\n`)
          );
        }

        // Send content_block_stop
        const blockStopEvent: StreamEvent = {
          type: 'content_block_stop',
          index: 0,
        };
        controller.enqueue(
          encoder.encode(`event: content_block_stop\ndata: ${JSON.stringify(blockStopEvent)}\n\n`)
        );

        // Send message_delta with final stats
        const messageDeltaEvent: StreamEvent = {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn', stop_sequence: null },
          usage: { output_tokens: outputTokens },
        };
        controller.enqueue(
          encoder.encode(`event: message_delta\ndata: ${JSON.stringify(messageDeltaEvent)}\n\n`)
        );

        // Send message_stop
        const stopEvent: StreamEvent = {
          type: 'message_stop',
        };
        controller.enqueue(
          encoder.encode(`event: message_stop\ndata: ${JSON.stringify(stopEvent)}\n\n`)
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = createErrorResponse('api_error', errorMsg);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Request-Id': messageId,
    },
  });
}

/**
 * Handle incoming request
 */
async function handleRequest(req: Request, config: ProxyConfig): Promise<Response> {
  const url = new URL(req.url);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, Anthropic-Version',
    };

    // Only set CORS header if origin is allowed
    if (isOriginAllowed(origin, config)) {
      headers['Access-Control-Allow-Origin'] = origin!;
      headers['Vary'] = 'Origin';
    }

    return new Response(null, {
      status: 204,
      headers,
    });
  }

  // Health check
  if (url.pathname === '/health' || url.pathname === '/') {
    return new Response(JSON.stringify({ status: 'ok', service: 'oci-anthropic-proxy' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only handle POST /v1/messages
  if (req.method !== 'POST' || url.pathname !== '/v1/messages') {
    return new Response(
      JSON.stringify(
        createErrorResponse('not_found_error', `Unknown endpoint: ${req.method} ${url.pathname}`)
      ),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse and validate request body with Zod
    const rawBody = await req.json();
    const validationResult = anthropicMessagesRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify(
          createErrorResponse(
            'invalid_request_error',
            `Invalid request: ${validationResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          )
        ),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = validationResult.data as AnthropicMessagesRequest;

    if (config.verbose) {
      console.warn(
        `[proxy] Request: model=${body.model}, messages=${body.messages.length}, stream=${body.stream}`
      );
    }

    if (body.stream) {
      return handleStreaming(body, config);
    } else {
      return handleNonStreaming(body, config);
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify(
          createErrorResponse(
            'invalid_request_error',
            `Validation error: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          )
        ),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[proxy] Error: ${message}`);

    return new Response(JSON.stringify(createErrorResponse('api_error', message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Start the proxy server
 */
export function startServer(config: ProxyConfig): { stop: () => void } {
  const server = Bun.serve({
    port: config.port,
    hostname: config.host,
    fetch: (req) => handleRequest(req, config),
  });

  console.warn(`🚀 OCI Anthropic-Compatible Proxy running at http://${config.host}:${config.port}`);
  console.warn(`   Region: ${config.region}`);
  console.warn(`   Profile: ${config.profile}`);
  console.warn(`   Compartment: ${config.compartmentId.substring(0, 30)}...`);
  console.warn('');
  console.warn('Configure Claude Code with:');
  console.warn(`   ANTHROPIC_API_URL=http://${config.host}:${config.port}`);
  console.warn('');

  return {
    stop: () => server.stop(),
  };
}

export { handleRequest };
