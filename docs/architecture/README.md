# Architecture Overview

This section documents the architecture, design decisions, and technical foundations of the OCI GenAI provider for Vercel AI SDK.

## Architecture Documents

### [Design Decisions](design-decisions.md)
Comprehensive analysis of architectural choices, including:
- Provider architecture and implementation patterns
- Authentication and authorization strategies
- Streaming protocol design
- Error handling and resilience
- Tool calling integration

### [Technology Stack](technology-stack.md)
Complete technical stack documentation:
- Core dependencies and versions
- OCI SDK components
- Vercel AI SDK integration
- Development and testing tools
- Build and deployment tooling

### [Code Conventions](code-conventions.md)
Project coding standards and patterns:
- TypeScript conventions
- File organization
- Naming conventions
- Documentation standards
- Testing patterns

## System Architecture

### High-Level Overview

```
┌─────────────┐
│   OpenCode  │
│  Application│
└──────┬──────┘
       │
       │ Vercel AI SDK
       │
┌──────▼──────────────────┐
│  OCI GenAI Provider     │
│  (@acedergren/oci-...)  │
├─────────────────────────┤
│  • Model Registry       │
│  • Request Adapter      │
│  • Response Transformer │
│  • Stream Handler       │
│  • Tool Converter       │
└──────┬──────────────────┘
       │
       │ OCI SDK
       │
┌──────▼──────────────────┐
│  OCI GenAI Service      │
│  (Cloud Infrastructure) │
└─────────────────────────┘
```

### Key Components

#### 1. Provider Interface (`OCIGenAIProvider`)
Implements Vercel AI SDK's `LanguageModelV3` interface to expose OCI models.

**Responsibilities:**
- Model catalog management
- Configuration validation
- Client initialization

#### 2. Model Implementation (`OCIGenAILanguageModel`)
Individual model instances that handle generation requests.

**Responsibilities:**
- Request transformation (AI SDK → OCI format)
- Response transformation (OCI → AI SDK format)
- Streaming protocol conversion
- Tool/function calling translation
- Error handling and retry logic

#### 3. OCI Client Wrapper
Manages OCI SDK authentication and API calls.

**Responsibilities:**
- Authentication (API key, instance principal, resource principal)
- Regional endpoint management
- Request/response logging
- Rate limiting and backoff

#### 4. Stream Processor
Converts OCI Server-Sent Events (SSE) to AI SDK async iterators.

**Responsibilities:**
- SSE parsing (`eventsource-parser`)
- Token-by-token streaming
- Error event handling
- Stream completion detection

#### 5. Tool Adapter
Translates between AI SDK and OCI tool calling formats.

**Responsibilities:**
- Tool definition conversion
- Tool call execution coordination
- Result formatting
- Error propagation

## Request Flow

### Non-Streaming Request

```
1. User calls generateText() with OCI model
   ↓
2. Provider validates configuration
   ↓
3. Model transforms AI SDK request → OCI format
   ↓
4. OCI Client sends authenticated request
   ↓
5. Model transforms OCI response → AI SDK format
   ↓
6. Result returned to user
```

### Streaming Request

```
1. User calls streamText() with OCI model
   ↓
2. Provider validates configuration
   ↓
3. Model transforms request + enables streaming
   ↓
4. OCI Client establishes SSE connection
   ↓
5. Stream Processor converts SSE → async iterator
   ↓
6. Tokens yielded incrementally to user
   ↓
7. Stream completion detected and closed
```

### Tool Calling Request

```
1. User defines tools in generateText()
   ↓
2. Tool Adapter converts AI SDK tools → OCI format
   ↓
3. Model includes tools in OCI request
   ↓
4. OCI returns tool call in response
   ↓
5. Tool Adapter converts OCI tool call → AI SDK format
   ↓
6. User executes tool function
   ↓
7. Tool result sent back in next request
   ↓
8. Model generates final response
```

## Authentication Flow

```
┌─────────────────────┐
│  Configuration      │
│  Priority (cascade) │
└──────┬──────────────┘
       │
       ├─ 1. Environment Variables (OCI_CONFIG_FILE, OCI_PROFILE)
       ├─ 2. Constructor Options (configFile, profile)
       ├─ 3. Default (~/.oci/config, profile: DEFAULT)
       │
┌──────▼──────────────┐
│  OCI Config Parser  │
└──────┬──────────────┘
       │
       ├─ API Key (user, tenancy, fingerprint, key_file)
       ├─ Instance Principal (for OCI Compute)
       ├─ Resource Principal (for OCI Functions)
       │
┌──────▼──────────────┐
│  OCI SDK Client     │
│  (Authenticated)    │
└─────────────────────┘
```

## Error Handling Strategy

### Retry-able Errors
- **429 Rate Limiting**: Exponential backoff (2^n seconds)
- **500 Internal Server Error**: Retry up to 3 times
- **503 Service Unavailable**: Retry up to 3 times
- **Network timeouts**: Retry with increasing timeout

### Non-Retry-able Errors
- **401 Unauthorized**: Authentication configuration issue
- **403 Forbidden**: IAM policy issue
- **404 Not Found**: Model or endpoint not found
- **400 Bad Request**: Invalid request parameters

### Error Propagation
All errors include:
- Original OCI error message
- HTTP status code
- Request ID (for OCI support)
- Suggested remediation steps

## Security Considerations

See [Security Best Practices](../security/README.md) for comprehensive security documentation.

### Key Security Measures
- **No credentials in code**: All auth via OCI config
- **Secure credential storage**: Keys in `~/.oci/` with 600 permissions
- **TLS for all API calls**: HTTPS only, no plain HTTP
- **Rate limiting**: Built-in backoff prevents abuse
- **Input validation**: All user input sanitized
- **Audit logging**: All API calls logged (optional)

## Performance Optimization

### Caching Strategy
- **Model metadata**: Cached for session duration
- **Configuration**: Parsed once per provider instance
- **OCI client**: Reused across requests (connection pooling)

### Streaming Optimization
- **Buffering**: Minimal buffering for low latency
- **Backpressure**: Handled via async iterators
- **Cancellation**: Supports request cancellation

### Resource Management
- **Connection pooling**: Enabled by default
- **Memory limits**: Configurable max response size
- **Timeout configuration**: Per-request and global timeouts

## Monitoring and Observability

### Logging
- **Debug logging**: `DEBUG=oci-genai:*` environment variable
- **Request/response logging**: Optional, disabled by default
- **Error logging**: Always enabled

### Metrics
- Request count (by model)
- Response latency (by model)
- Token usage (input/output)
- Error rate (by type)
- Stream duration

### Health Checks
- OCI API connectivity
- Authentication validity
- Model availability

## Deployment Patterns

### Development
```typescript
const oci = createOCI({
  profile: 'DEV',
  debug: true
});
```

### Production (Compute Instance)
```typescript
const oci = createOCI({
  auth: 'instance_principal',
  region: process.env.OCI_REGION
});
```

### Production (OCI Functions)
```typescript
const oci = createOCI({
  auth: 'resource_principal'
});
```

## Testing Strategy

See individual architecture documents for detailed testing approaches.

### Unit Tests
- Individual component testing
- Mock OCI SDK responses
- Error condition coverage

### Integration Tests
- End-to-end request/response
- Real OCI API calls (dev environment)
- Streaming functionality

### Performance Tests
- Latency benchmarks
- Throughput testing
- Concurrency testing

## Further Reading

- [Design Decisions](design-decisions.md) - Why we made specific choices
- [Technology Stack](technology-stack.md) - What we're built with
- [Code Conventions](code-conventions.md) - How we write code
- [Provider Flow](provider-flow.md) - Detailed request/response flow

---

**Architecture Version**: 1.0.0
**Last Updated**: 2026-01-26
