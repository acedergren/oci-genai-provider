# Common Backend Questions

This document consolidates frequently-asked questions across multiple frontend demos. Individual frontend requirements docs reference these shared questions to reduce duplication.

---

## Authentication & Models

### Q1: Model Selection & Discovery
Which embedding and generation models are available? Should the frontend:
- Fetch available models from an endpoint at app load?
- Get them as part of initial page data?
- Maintain a hardcoded list updated with each release?

**Why it matters**: Different demos (chat, RAG, embeddings) need model lists, and consistency is important.

---

### Q2: Model Validation
When a user selects a model, should the frontend:
- Validate the selection before sending a request?
- Let the backend reject invalid models?
- Both (validate locally for UX, reject server-side for security)?

**Applies to**: chat-demo, nextjs-chatbot, cli-tool, rag-demo, rag-reranking-demo

---

## Data & Context Management

### Q3: Conversation History
For multi-turn interactions, should the frontend:
- Send the full conversation history with each message?
- Send only the latest message?
- Send a summary or token-limited history?

**Why it matters**: Affects performance, token costs, and context window management.

**Applies to**: chat-demo, nextjs-chatbot, cli-tool

---

### Q4: Message Format
What's the canonical message structure the backend expects?

Example options:
```javascript
// Option A: OpenAI-style
{ role: 'user'|'assistant'|'system', content: string }

// Option B: Custom format
{ type: 'user'|'assistant', text: string, timestamp?: number }

// Option C: Custom parts format
{ role: 'user'|'assistant', parts: [{ type: 'text', text: string }] }
```

**Applies to**: All chat-based demos (chat-demo, nextjs-chatbot, cli-tool)

---

## Error Handling & Resilience

### Q5: Error Types & Codes
What specific error types should the frontend expect and handle differently?

Examples:
- Invalid model (400 Bad Request)
- Rate limit exceeded (429 Too Many Requests)
- Service unavailable (503 Service Unavailable)
- Token limit exceeded (custom code?)
- Network timeout (connection timeout)

**Why it matters**: Frontend can provide meaningful feedback and retry strategies per error type.

**Applies to**: All demos

---

### Q6: Retry Strategy
When requests fail, should the frontend:
- Retry automatically with exponential backoff?
- Ask the user to retry?
- Not retry at all (let backend handle)?

**Applies to**: All demos that make API calls

---

## Streaming & Response Handling

### Q7: Streaming Format
For real-time responses, what format should be used?

Options:
- Server-Sent Events (SSE)
- WebSocket
- JSON streaming (one JSON object per line)
- Text streaming (plain text chunks)

**Applies to**: chat-demo, nextjs-chatbot, cli-tool

---

### Q8: Stream Completion Signal
How does the frontend know when a streamed response is complete?

Options:
- Special "end" marker in the stream
- Stream ends (EOF)
- Explicit HTTP completion
- Separate "done" message

**Applies to**: chat-demo, nextjs-chatbot, cli-tool, stt-demo

---

## Configuration & Defaults

### Q9: Configuration Defaults
Are there sensible defaults the frontend should use if not specified?

Examples:
- Default model if none selected?
- Default language for speech?
- Default embedding model for RAG?
- Default number of results to show?

**Applies to**: All demos

---

### Q10: Configuration Override
Should configuration be overridable via:
- CLI flags (for CLI tool)?
- Environment variables?
- HTTP headers?
- URL query parameters?
- User interface dropdowns?

**Applies to**: All demos

---

## Performance & Optimization

### Q11: Batch Operations
For operations on multiple items (embeddings, reranking), should the frontend:
- Send all items in one request?
- Batch them in chunks?
- Send them one at a time?

**Why it matters**: Affects latency and resource usage.

**Applies to**: rag-demo, rag-reranking-demo, stt-demo

---

### Q12: Caching & Reuse
Can/should the frontend cache:
- Embeddings of documents?
- Transcriptions of audio files?
- Model metadata?

**Why it matters**: Can significantly improve performance for repeated operations.

**Applies to**: rag-demo, rag-reranking-demo, stt-demo

---

## Language & Localization

### Q13: Language Specification
For demos that support multiple languages, should the frontend:
- Let the backend auto-detect language?
- Require explicit language specification?
- Provide a language selector UI?

**Applies to**: stt-demo (speech transcription), rag-demo (multilingual embeddings)

---

### Q14: Language Format
What format should language be specified in?

Options:
- ISO 639-1 (en, es, fr)
- ISO 639-3 (eng, spa, fra)
- BCP 47 (en-US, es-ES, fr-CA)
- Custom codes

**Applies to**: stt-demo, multilingual scenarios

---

## Output & Display

### Q15: Response Metadata
Should responses include metadata beyond the primary content?

Examples:
- Token counts / usage statistics
- Confidence scores / quality metrics
- Execution time / latency
- Model info (version, variant)
- Alternative options / suggestions

**Why it matters**: Frontend can show this info to users or use it for quality assurance.

**Applies to**: All demos

---

### Q16: Output Format Options
Should results be available in multiple formats?

Examples:
- JSON (machine-readable)
- Plain text (human-readable)
- CSV (for tabular data)
- Markdown (for documentation)
- HTML (for rendering)

**Applies to**: All demos

---

## How to Use This Document

When a frontend requirements doc says:

> See [Backend Questions](../../BACKEND_QUESTIONS.md#q3-conversation-history)

It's referring to a question in this shared document. This prevents:
- Duplicate questions across 6 demos
- Inconsistent question wording
- Answers being given separately in each demo

**For backend teams**: Review this document once and provide answers that apply to all relevant demos, then reference the shared answer in each demo's Discussion Log.

---

## Discussion Log

*Awaiting backend feedback on common questions.*

Once answered, individual demos will reference the answers provided here.
